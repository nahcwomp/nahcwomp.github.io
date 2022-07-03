$( () => {
    addSorting();
    addExport();
    addExpand();

    const history = []
    addHide(history);
    addUndo(history);

    addSave();
    addMove();
    addMoveTeams();
    addFilter(history);
    addReset();
});

function addSorting() {
  let s = new Sortable($('tbody')[0], {
    animation: 150
  });

  $('tr').each((i, el) => {
    new Sortable(el, {
        draggable: '.pokemon',
        animation: 150
    });
  });

}

function hideRow(row, history) {
    row.toggleClass('hide');
    history.push(row);
}

function addHide(history) {
  // Change to hide
  $('.remove-button').click( (e, f) => { console.log(e.target); hideRow($(e.target.parentNode.parentNode), history)});
}

function addUndo(history) {
  $('#undo').click( (e, f) => {
     if (!history) return;
     let row = history.pop();
     row.toggleClass('hide');
  })
}

function serialize() {
  let rows = $('tr').filter((i, node) => $(node).css('display') !== 'none');
  let urls = rows.find('a').map((a, b) => b.href);
  let children = rows.map((a, b) => $(b).find('.pokemon'));
  let players = rows.map((a, b) => $(b).data('player-num'))
  let res = urls.map((i, url) => {
    return {
      'url': url,
      'team': Array.from(children[i]).map((a, b) => $(a).data('pokemon')),
      'player': players[i]
    };
  });
  return JSON.stringify([...res]);
}

function addExport() {
  $('#export').click(() => { $('#serialization').html(serialize()); });
}

function addExpand() {
  $('.expand-button').click((e, f) => {
    if (!$(e.target).hasClass('expanded')) {
      expandRow($(e.target, true));
    }
    else {
      compressRow($(e.target));
    }
  });

  $('#expand-all').click((e, f) => {
    let transform = $(e.target).hasClass('expanded') ? compressRow : expandRow;
    let text = $(e.target).hasClass('expanded') ? 'Show sets' : 'Collapse';
    $('tr').each((i, row) => { transform($(row), false); });
    if ($(e.target).hasClass('expanded')) {
        $('.expand').remove();
        //$('.pokemon').width("");
    }
    else {
      //$('.pokemon').width(500);
    }
    $(e.target).text(text);
    $(e.target).toggleClass('expanded');
    $('.pokemon').toggleClass('expanded');
  });
}

function expandRow(row, calcWidth) {
  //if ($(button).hasClass('expanded')) return;
  let pokemon_cells = row.find('.pokemon');
  pokemon_cells.map((i, cell) => {
    let exp = $(cell).data('export');
    var move_s = $(cell).data('moves')
    var moves;
    if (typeof move_s == 'string') {
      move_s = move_s.replaceAll('Nature\'s', 'Natures').replaceAll("\'", '\"')
      moves = $.parseJSON(move_s);
    }
    else { moves = move_s}

    let move1 = moves[0] || "???";
    let move2 = moves[1] || "???";
    let move3 = moves[2] || "???";
    let move4 = moves[3] || "???";

    const cache = {
        'heavydutyboots': 'boots',
        'stickybarb': 'barb',
        'choicescarf': 'scarf',
        'choiceband': 'band',
        'choicespecs': 'specs',
        '': '???'
    }
    let item = cache[$(cell).data('item')] || $(cell).data('item');
    $(cell).append(`<div class='expand'>${exp} @ ${item}</span>`); // Change to list
    $(cell).append(`<div class='move expand'>${move1} ${move2}<br>${move3} ${move4}</div>`); // Change to list
  });

  //const widths = $('td').map(function() { return $(this).width()}).get();
  //const maxWidth = Math.max.apply(Math, widths);
  //$('.pokemon').width(maxWidth);
  //button.text('Collapse');
  //button.toggleClass('expanded');
}

function compressRow(button) {
  //if (!$(button).hasClass('expanded')) return;
  //let pokemon_cells = button.parent().parent().find('.pokemon');
  //pokemon_cells.find('.expand').remove();
  //$('.pokemon').width("");
  //button.text('Expand');
  //button.toggleClass('expanded');
}

function addSave() {
  $('#save-form').submit( (e, f) => {
      e.preventDefault();
      $.ajax({
        type: 'POST',
        url: $('#save-form').data('url'),
        data: {
          serialization: serialize(),
          scout_id: $('#save-form').data('scout-id'),
          csrfmiddlewaretoken: $(e.target).serializeArray()[0].value
        },
        success: (res) => {
          let url = res.url;
          window.history.replaceState('', '', url);
          $('#save-form').data('scout-id', res.scout_id);
        }
      })
  })
}

function addMove() {
    $('#move-form').submit( (e, f) => {
        e.preventDefault();
        // get the position and pokemon
        let pokemon = $('#move-pokemon').val();
        let position = parseInt($('#move-position').val()) + 3;
        move(pokemon, position);
    });
}

function addMoveTeams() {
    $('#move-team-form').submit( (e, f) => {
        e.preventDefault();
        let filter_pokemon_list = $('#move-team-pokemon').val().split(',').map(s => s.trim())
        let position = parseInt($('#move-team-position').val());
        moveTeams(filter_pokemon_list, position)
    });
}

function moveTeams(filter_pokemon, position) {
    // filter all rows that have pokemon a and pokemon b
    // TODO: extract
    let team_rows = $('tr').filter((i, element) => {
        return filter_pokemon.every(
            pokemon => $(element).children(`[data-pokemon='${pokemon}']`).length
        );
    });

    team_rows.map((i, row) => {
        let offset = $(row).index() > position ? 0 : 1;
        let target = $(row).parent().children().eq(position+offset-1);
        $(row).insertBefore(target);
    });

    $('.row-num').map((i, e) => $(e).html(i+1));
}

function move(pokemon, position) {
    let pokemon_cells = $(`[data-pokemon='${pokemon}']`);
    pokemon_cells.map((i, cell) => {
        let offset = $(cell).index() > position ? 0 : 1;
        let target = $(cell).parent().children().eq(position+offset);
        $(cell).insertAfter(target);
    })
}

function addFilter(history) {
    $('#filter-form').submit( (e, f) => {
        e.preventDefault();
        let pokemon = $('#filter-pokemon').val();
        let filter_type = $('[name=filter-type]:checked').val();

        let matches = $(`.pokemon[data-pokemon='${pokemon}']`).parent();

        // todo: use class to select rows
        let rows = (filter_type === 'include' ? $('tr').not(matches): matches).not('.hide');
        // todo: add undo filter
        rows.map((i, row) => { $(row).toggleClass('hide') });
    })
}

function addReset() {
    $('#reset').click( (e) => {$('tr').removeClass('hide'); console.log('reset') });
}
