function installEventHandlers(selector) {
  selector.find('.figure-filter-op').change(filterOpChanged);
  selector.find('.figure-filter-add').click(clickFilterAddSubfilter);
  selector.find('.figure-filter-remove').click(filterRemoveSubfilter);
  // selector.find('.figure-filter-move').change(updateQuery); // removed because now done by constellation
}

var addButtonHtml = "<button class='figure-filter-add'>Add</button>";
var removeButtonHtml = "<button class='figure-filter-remove'><span class='glyphicon glyphicon-remove'></span></button>";

if (!Array.prototype.forEach) { throw "I was expecting Array.forEach to be defined"; }
if (!Array.prototype.map) { throw "I was expecting Array.map to be defined"; }

var figureMoveHtml = "<select class='figure-filter-move form-control'><option value='*' selected=true>any figure</option>";
moves().forEach(function(move) {
  var selectedIfChain = ('chain'===move) ? ' selected ' : '';
  figureMoveHtml += '<option value="'+move+'">'+move+'</option>';
});
figureMoveHtml += "</select>";

var filterHtml = "\
    <div class='figure-filter' data-op=and>\
      <select class='figure-filter-op form-control'>\
        <option value='figure' selected>figure</option>\
        <option value='and'>and</option> \
        <option value='or'>or</option>\
        <option value='then'>then</option>\
        <option value='no'>no</option>\
        <option value='all'>all</option>\
        <option value='anything but'>anything but</option>\
      </select>\
      <span class='figure-filter-end-of-subfigures'></span>\
    </div>";


function maxSubfilterCount(op) {
  switch(op) {
  case 'figure':
    return 0;
  case 'all':
  case 'no':
  case 'anything but':
    return 1;
  case undefined:
    throw 'missing argument to maxSubfilterCount';
  default:
    return Infinity;
  }
}

function minSubfilterCount(op) {
  switch(op) {
  case 'no':
  case 'all':
  case 'anything but':
    return 1;
  case undefined:
    throw 'missing argument to minSubfilterCount';
  default:
    return 0;
  }
}

function minUsefulSubfilterCount(op) {
  switch(op) {
  case 'and':
  case 'or':
  case 'then':
    return 2;
  default:
    return minSubfilterCount(op);
  }
}

function clickEllipsis(e) {
  var $this = $(this);
  $this.toggleClass('ellipsis-expanded');
  $this.siblings('.figure-filter-accordion').toggle();
}

function filterOpChanged(e) {
  var opSelect = $(e.target);
  var filter = opSelect.closest('.figure-filter');
  var op = opSelect.val();
  var actualSubfilterCount = filter.children('.figure-filter').length;
  while (actualSubfilterCount > maxSubfilterCount(op)) {
    filter.children('.figure-filter').last().remove();
    actualSubfilterCount--;
  }
  while (actualSubfilterCount < minUsefulSubfilterCount(op)) {
    filterAddSubfilter(filter);
    actualSubfilterCount++;
  }
  if (op === 'figure') {
    addFigureFilterMoveConstellation(filter);
  } else {
    removeFigureFilterMoveConstellation(filter);
  }
  var hasNoAddButton = filter.children('.figure-filter-add').length === 0;
  if (hasNoAddButton && actualSubfilterCount < maxSubfilterCount(op)) {
    var addButton = $(addButtonHtml);
    addButton.click(clickFilterAddSubfilter);
    filter.children('.figure-filter-end-of-subfigures').after(addButton);
  } else if ((!hasNoAddButton) && actualSubfilterCount >= maxSubfilterCount(op)) {
    filter.children('.figure-filter-add').remove();
  }
  ensureChildRemoveButtons(filter);
  updateAddButtonText(filter, op);
  
  filter.children('.figure-filter').attr('data-op', op);
  updateQuery();
}

function updateAddButtonText(filter, op) {
  filter.children('.figure-filter-add').text('add '+ op);
}

function ensureChildRemoveButtons(filter) {
  var subfilters = filter.children('.figure-filter');
  var op = filter.children('.figure-filter-op').val();
  if (subfilters.length > minSubfilterCount(op)) {
    subfilters.each(function () {
      var $this = $(this);
      if (0 === $this.children('.figure-filter-remove').length) {
        var removeButton = $(removeButtonHtml);
        removeButton.click(filterRemoveSubfilter);
        if ($this.children('.figure-filter').length > 0) {
          $this.children('.figure-filter').first().before(removeButton);
        } else {
          $this.children('.figure-filter-end-of-subfigures').before(removeButton);
        }
      }
    });
  } else if (subfilters.length <= minSubfilterCount(op)) {
    filter.children('.figure-filter').each(function() {
      $(this).children('.figure-filter-remove').remove();
    });
  }
}

function removeFigureFilterMoveConstellation(filter) {
  filter.children('.figure-filter-move').remove();
  filter.children('.figure-filter-ellipsis').remove();
  filter.children('.figure-filter-accordion').remove();
}

function addFigureFilterMoveConstellation(filter) {
  filter
    .append(makeFigureFilterAccordion(filter)) // even to the right of the 'X'
    .children('.figure-filter-op')
    .after(makeFigureFilterEllipsisButton(filter)) // 2 right of figure-filter-op
    .after(makeFigureFilterMoveSelect(filter));    // 1 right of figure-filter-op
}

function makeFigureFilterMoveSelect(filter) {
  return $(figureMoveHtml).change(figureFilterMoveChange);
}

function makeFigureFilterEllipsisButton(filter) {
  return $("<button class='btn btn-default figure-filter-ellipsis'>...</button>").click(clickEllipsis);
}

function makeFigureFilterAccordion(filter) {
  return $("<div class='figure-filter-accordion'></div>").hide();
}

var chooserToFilterHtml = {};

chooserToFilterHtml[chooser_places] = function(move) {
  var options = ['<option value="*">*</option>'].concat(
    anglesForMove(move).map(function(angle) {
      return '<option value="'+angle.toString()+'">'+degreesToWords(angle,move)+'</option>';
    }));
  return '<select class="form-control chooser-argument">'+options.join()+'</select>';
};

chooserToFilterHtml[chooser_left_right_spin] = function(move) {
  var options = ['<option value="*">*</option>',
                 '<option value="true">left</option>',
                 '<option value="false">right</option>'];
  return '<select class="form-control chooser-argument">'+options.join()+'</select>';
};

chooserToFilterHtml[chooser_beats] = function(move) {
  var options = ['*',8,16,0,1,2,3,4,6,8,10,12,14,16,20,24,32,48,64].map(function(b) {
    return '<option value="'+b+'">'+b+'</option>';
  });
  return '<select class="form-control chooser-argument">'+options.join()+'</select>';
};

chooserToFilterHtml[chooser_boolean] = function(move) {
  var name = generateUniqueNameForRadio();
  var radios = ["<label><input type='radio' name='"+name+"' value='*' checked />*</label>",
                "<label><input type='radio' name='"+name+"' value='true'/>yes</label>",
                "<label><input type='radio' name='"+name+"' value='false'/>no</label>"];
  return "<div class='chooser-argument'>"+radios.join()+"</div>";
};

var _uniqueNameForRadioCounter = 9000;
function generateUniqueNameForRadio() {
  return 'uniqueNameForRadio' + _uniqueNameForRadioCounter++;
}

// TODO: add more choosers


function figureFilterMoveChange() {
  var figureFilterMove = $(this);
  var accordion = figureFilterMove.siblings('.figure-filter-accordion');
  accordion.children().remove();
  var move = figureFilterMove.val();
  var formals = isMove(move) ? parameters(move) : [];
  formals.forEach(function(formal) {
    var html_fn = chooserToFilterHtml[formal.ui] || function() {return '<div>'+formal.name+'</div>';};
    var chooser = $(html_fn(move));
    chooser.change(updateQuery);
    var label = $('<div>'+ formal.name +' </div>');
    label.append(chooser);
    accordion.append(label);
  });
  updateQuery();
}

function clickFilterAddSubfilter(e) {
  filterAddSubfilter($(this).closest('.figure-filter'));
  updateQuery();
}

function filterAddSubfilter(parentFilter) { // caller should updateQuery() when done
  var childFilter = $(filterHtml);
  installEventHandlers(childFilter);
  addFigureFilterMoveConstellation(childFilter);
  childFilter.insertBefore(parentFilter.children('.figure-filter-end-of-subfigures'));
  ensureChildRemoveButtons(parentFilter);
  var op = parentFilter.children('.figure-filter-op').val();
  childFilter.attr('data-op', op);
}

function filterRemoveSubfilter(e) {
  $(this).closest('.figure-filter').remove();
  updateQuery();
}

var updateQuery;              // defined below...

function buildFigureQuery(figure_filter) {
  figure_filter = $(figure_filter);
  var op = figure_filter.children('.figure-filter-op').val();
  if (op === 'figure') {
    // TODO: this then-clause is getting big - relo to it's own function?
    var move = figure_filter.children('.figure-filter-move').val();
    var a = [op, move];
    if (accordionIsHidden(figure_filter)) { return a; }
    var formals = isMove(move) ? parameters(move) : [];
    formals.forEach(function(formal, i) {
      var chooser = $(figure_filter.children('.figure-filter-accordion').children()[i]).find('.chooser-argument');
      // TODO: add more choosers
      if (chooser_places === formal.ui) {
        var degrees = chooser.val();
        a.push(degrees);
      } else if (chooser_left_right_spin === formal.ui) {
        var left = chooser.val();
        a.push(left);
      } else if (chooser_beats === formal.ui) {
        var beats = chooser.val();
        a.push(beats);
      } else if (chooser_boolean === formal.ui) {
        // $('#figure-filter-root .figure-filter-accordion input[type="radio"]:checked').val()
        var boolish = chooser.find('input:checked').val();
        a.push(boolish);
      } else {
        a.push('*');
      }
    });
    return a;
  } else {
    var kids = figure_filter.children('.figure-filter').get();
    var filter = kids.map(buildFigureQuery);
    filter.unshift(op);
    return filter;
  }
}

function accordionIsHidden($figure_filter) {
  return ! $figure_filter.children('.figure-filter-accordion').is(':visible');
}

///////////////////// PAGE LOADED

jQuery(document).ready(function() {
  updateQuery = function() {
    var fq = buildFigureQuery($('#figure-filter-root'));
    $('#figure-query-buffer').val(JSON.stringify(fq));
    $('.figure-query-sentence').text(buildFigureSentence(fq));
    if (dataTable) {
      dataTable.draw(); 
    }
  };

  addFigureFilterMoveConstellation($('#figure-filter-root'));
  installEventHandlers($('#figure-filter-root'));
  updateQuery();

  if (!Array.isArray) {
    Array.isArray = function(arg) {
      return Object.prototype.toString.call(arg) === '[object Array]';
    };
  }

  // oh, I can't use arrays in params? Fine, I'll create hashes with indexes as keys
  function arrayToObject (a) {
    if (Array.isArray(a)) {
      var o = { faux_array: true };
      for (var i=0; i<a.length; i++) {
        o[i] = arrayToObject(a[i]);
      }
      return o;
    } else {
      return a;
    }
  }

  var dataTable = 
        $('#dances-table').DataTable({
          "processing": true,
          "serverSide": true,
          "ajax": {
            url: $('#dances-table').data('source'),
            type: 'POST',
            data: function(d) {
              // d.figureQuery = arrayToObject(['and', ['no', ['figure', 'gyre']], ['then', ['figure', 'roll away'], ['figure', 'swing']]]);
              d.figureQuery = arrayToObject(JSON.parse($('#figure-query-buffer').val()));
            }
          },
          "pagingType": "full_numbers",
          "dom": 'ft<"row"<"col-sm-6 col-md-3"i><"col-sm-6 col-md-3"l>>pr',
          language: {
            searchPlaceholder: "filter by title, choreographer, and user"
          },
          "order": [[ 3, "desc" ]],
          "columns": [
            {"data": "title"},
            {"data": "choreographer_name"},
            {"data": "user_name"},
            {"data": "updated_at"}
          ]
        });
});
