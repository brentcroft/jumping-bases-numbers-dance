
function showHideCSS( selector ) {
    document
        .querySelectorAll( selector )
        .forEach( c => {
            var s = c.style.display;
            if ( s == '' ) {
                c.style.display  =  'none';
            } else {
                c.style.display  =  '';
            }
        } );
}

function showHide( id ) {
    var c = document.getElementById( id );
    if ( c ) {
        var s = c.style.display;
        if ( s == '' ) {
            c.style.display  =  'none';
        } else {
            c.style.display  =  '';
        }
    }
}

function showHideAll( ids = [] ) {
    ids.forEach( id => showHide( id ) );
}


function sortTable( tableId, columnIndex, isNumber = false, isFraction = false ) {
  var table, rows, switching, i, x, y, shouldSwitch;

  table = document.getElementById( tableId );

  table
      .dataset
      .sortColumn = columnIndex;

  var th = table.rows[0].getElementsByTagName("TH")[columnIndex];

  // if already ascending then sort descending
  var descending = th.classList.contains( "sort-asc")
  var clear = th.classList.contains( "sort-desc")

  var thc = table.rows[0].getElementsByTagName("TH");
  for (var i = 0; i < thc.length; i++ ) {
    thc[i].classList.remove( "sort-asc");
    thc[i].classList.remove( "sort-desc");
  }

  if (clear) {
    return;
  } else if ( descending ) {
    th.classList.add( "sort-desc");
  } else {
    th.classList.add( "sort-asc");
  }

  switching = true;

  function Fraction( s ) {
    s = s.trim();
    if ( s.startsWith( "(" ) && s.endsWith( ")" ) ) {
        s = s.substring( 1, s.length - 1 );
        s = s.trim();
    }
    var f = s.split( /\s*[\/\|,]\s*/ );
    f[0] = Number( f[0].trim() );

    if ( f[0] == 0 ) {
        return 0;
    } else if( f.length == 1 ) {
        return f[0];
    }

    f[1] = Number( f[1].trim() );

    return ( f[0] == f[1] ) ? 1 : ( f[0] / f[1] );
  }

  /* Make a loop that will continue until
  no switching has been done: */
  while (switching) {
    // Start by saying: no switching is done:
    switching = false;
    rows = table.rows;
    /* Loop through all table rows (except the
    first, which contains table headers): */
    for ( i = 1; i < (rows.length - 1); i++) {
      // Start by saying there should be no switching:
      shouldSwitch = false;
      /* Get the two elements you want to compare,
      one from current row and one from the next: */
      x = rows[i].getElementsByTagName("TD")[columnIndex];
      y = rows[i + 1].getElementsByTagName("TD")[columnIndex];

      if (y && !y.classList.contains("sum-total") ) {
          var xT = x ? x.innerHTML : null;
          var yT = y ? y.innerHTML : null;

          if ( xT && yT ) {
              xT = xT.toLowerCase();
              yT = yT.toLowerCase();

              var xV = isNumber ? isFraction ? Fraction( xT ) :  Number( xT ) :  xT;
              var yV = isNumber ? isFraction ? Fraction( yT ) :  Number( yT ) :  yT;

              // Check if the two rows should switch place:
              if ( descending ? (xV < yV) : (xV > yV)) {
                // If so, mark as a switch and break the loop:
                shouldSwitch = true;
                break;
              }
          }
      }
    }
    if (shouldSwitch) {
      /* If a switch has been marked, make the switch
      and mark that a switch has been done: */
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
    }
  }
}

function getCycleIndexMonomialTex( orbitSystem ) {
    var cimHtml = "";
    for (const [ k, e ] of Object.entries( orbitSystem.cycleIndexMonomial )) {
        if ( k > 1 ) {
            cimHtml = cimHtml + `a_{${ k }}^{${ e }}`;
        }
    }
    return cimHtml;
}

function getCycleIndexMonomialHtml( orbitSystem ) {
    var cimHtml = "";

    cimHtml += `(<code>e</code><sup>${ orbitSystem.identityPoints.length }</sup>) `;

    for (const [ k, e ] of Object.entries( orbitSystem.cycleIndexMonomial )) {
        if ( k > 1 ) {
            cimHtml = cimHtml + `<i>a</i><sup>${ e }</sup><sub style='position: relative; left: -.5em;'>${ k }</sub>`;
        }
    }
    return cimHtml;
}


function drawOrbitSystemTable( tableArgs ) {

    var { containerId, orbitSystem, cellClick, clearClick, totalClick, midi = false, conj = false, perms = false } = tableArgs;

    const tableContainerId = containerId + "_table";
    const tableId = tableContainerId + "_data";

    var chainsText = `<table id="${ tableId }" class='chain-details summary sortable'>`;

    chainsText += "<caption>Orbit System: ";
    chainsText += `b=[${ orbitSystem.box.bases.join( ', ' ) }], `;
    chainsText += `t=${ orbitSystem.box.volume - 1 }, `;
    chainsText += `w=${ orbitSystem.maxWeight }, `;
    chainsText += `f=${ orbitSystem.fundamental }, `;
    chainsText += "</caption>";

    var colIndex = 0;
    chainsText += "<tr>";
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true )'>Index</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ } )' class='midi' style='display: ${midi?"":"none"};'>Instrument</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ } )' class='midi' style='display: ${midi?"":"none"};'>Channel</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ } )' class='midi' style='display: ${midi?"":"none"};'>Percussion</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ } )' class='midi' style='display: ${midi?"":"none"};'>Repeat</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ } )' class='midi' style='display: ${midi?"":"none"};' width='20%'>Valence</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ } )' width='70%'>Orbit</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )' width='8%'>Point Sum</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )' width='8%'>Id Sum</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true )' width='5%'>Order</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true )'>Harmonic</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )'>Line</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )'>Centre</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )'>Per<sup>2</sup></th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )'>Attack</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true )' width='8%'>GCD / LCM</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true )'>Weight</th>`;
    chainsText += "</tr>";

    chainsText += "<tr>";
    chainsText += `<th align="center"><code>e</code></th>`;
    chainsText += `<th colspan='5' class='midi' style='display: ${midi?"":"none"};'></th>`;

    if ( perms ) {
        const identityPoints = orbitSystem.identityPoints.map( p => "( " + p.coords.map( c => c.id ).join( ' ' ) + " )" ).join(", ");
        chainsText += `<th id="${ tableId }.e" align='center' onclick="${ clearClick }"><code>${ identityPoints }</code></th>`;
    } else {
        const identityPoints = orbitSystem.identityPoints.map( p => "{ " + canonicalize( p.coords[0].coord ) + " }" ).join(", ");
        chainsText += `<th id="${ tableId }.e" align='center' onclick="${ clearClick }"><code>${ identityPoints }</code></th>`;
    }

    const maxIndex = orbitSystem.box.volume - 1;

    const initialPointsSum = new Array( orbitSystem.box.bases.length ).fill( 0 );
    const identityPointsSum = orbitSystem.identityPoints.reduce( (a, p) => addition( a, p.coords[0].coord ), initialPointsSum );
    const identityIdSum = orbitSystem.identityPoints.reduce( (a, p) => a + p.coords[0].id, 0 );
    const identityIdSumGcd = gcd( maxIndex, identityIdSum );

    chainsText += `<th id="${ tableId }.f" align='center' onclick="${ clearClick }"><code>(${ identityPointsSum })</code></th>`;
    chainsText += `<th id="${ tableId }.f" align='center' onclick="${ clearClick }"><code>${ identityIdSum / identityIdSumGcd } * ${ identityIdSumGcd }</code></th>`;

    chainsText += "<th colspan='7'></th>";
    chainsText += "</tr>";

    const orbits = orbitSystem.orbits;

    for ( var i = 0; i < orbits.length; i++ ) {

        var orbit = orbits[ i ];

        var isSelfConjugate = ( orbit.index == orbit.conjugate.index );
        var isFirstConjugate = ( orbit.index < orbit.conjugate.index );

        // ignore later conjugate
        if ( !isSelfConjugate && !isFirstConjugate && conj) {
            continue;
        }


        var orbitSpace = (isSelfConjugate && conj)
            ? maxIndex * orbit.order / 2
            : maxIndex * orbit.order;

        var orbitIdSum = orbit.getIdSum();
        var orbitSpaceGcd = gcd( maxIndex, orbitIdSum );

        var onSelectInstrument = `setMidiInstrument( ${ orbit.index }, this.value )`;
        var onSelectPercussion = `setMidiInstrument( ${ orbit.index }, this.value, true )`;
        var onSelectChannel = `setMidiChannel( ${ orbit.index }, this.value )`;
        var onSelectRepeat = `setMidiRepeats( ${ orbit.index }, this.value )`;

        chainsText += `<tr>`;
        chainsText += `<td align="center">${ isSelfConjugate ? orbit.index : isFirstConjugate ? orbit.index : "<sup>(" + orbit.index + ")</sup>" }</td>`;
        chainsText += `<td align="center" class='midi' style='display: ${midi?"":"none"};'>${ getInstrumentSelectorHtml( orbit.midi.instrument, onSelectInstrument ) }</td>`;
        chainsText += `<td align="center" class='midi' style='display: ${midi?"":"none"};'>${ getChannelSelectorHtml( orbit.midi.channel, onSelectChannel ) }</td>`;
        chainsText += `<td align="center" class='midi' style='display: ${midi?"":"none"};'>${ getPercussionInstrumentSelectorHtml( orbit.midi.percussion, onSelectPercussion ) }</td>`;
        chainsText += `<td align="center" class='midi' style='display: ${midi?"":"none"};'>${ getRepeatSelectorHtml( orbit.midi.repeats, onSelectRepeat ) }</td>`;

        if ( perms ) {
            if ( isSelfConjugate && conj ) {
                // self-conjugates pair off so must have even order
                var scValence = orbit.valence.slice( 0, Math.ceil( orbit.valence.length / 2 ) );
                var scMembersFirst = orbit.coords.slice( 0, Math.ceil( orbit.coords.length / 2 ) );
                var scMembersRest = orbit.coords.slice( Math.ceil( orbit.coords.length / 2 ), orbit.coords.length );

                chainsText += `<td align="center" class='midi' style='display: ${midi?"":"none"};'>${ scValence }</td>`;
                chainsText += `<td id="${ tableId }.${ orbit.index }" class='orbit' align='center' onclick="${ cellClick }">( ${ scMembersFirst.map( c => c.id ).join( ' ' ) } &#8600;<br/>${ scMembersRest.map( c => c.id ).join( ' ' ) } )&#8598;</td>`;
                chainsText += `<td align="center">(${ orbit.sum.join( ', ' ) })</td>`;
                chainsText += `<td align="center">${ orbitIdSum / orbitSpaceGcd } * ${ orbitSpaceGcd }</td>`;
            } else if ( isFirstConjugate && conj ) {
                var conjOrbit = orbits[ orbit.conjugate.index - 1 ];
                var conjOrbitIdSum = conjOrbit.getIdSum();
                var conjOrbitSpaceGcd = gcd( maxIndex, conjOrbitIdSum );
                chainsText += `<td align="center" class='midi' style='display: ${midi?"":"none"};'>${ orbit.valence.join( C_SEP ) }</td>`;
                chainsText += `<td id="${ tableId }.${ orbit.index }.${ conjOrbit.index }" class='orbit' align='center' onclick="${ cellClick }">( ${ orbit.coords.map( c => c.id ).join( ' ' ) } )<br/>( ${ conjOrbit.coords.map( c => c.id ).join( ' ' ) } )</td>`;
                chainsText += `<td align="center">(${ orbit.sum.join( ', ' ) })<br/>(${ conjOrbit.sum.join( ', ' ) })</td>`;
                chainsText += `<td align="center">${ orbitIdSum / orbitSpaceGcd } * ${ orbitSpaceGcd }<br/>${ conjOrbitIdSum / conjOrbitSpaceGcd } * ${ conjOrbitSpaceGcd }</td>`;
            } else {
                chainsText += `<td align="center" class='midi' style='display: ${midi?"":"none"};'>${ orbit.valence.join( C_SEP ) }</td>`;
                chainsText += `<td id="${ tableId }.${ orbit.index }" class='orbit' align='center' onclick="${ cellClick }">( ${ orbit.coords.map( c => c.id ).join( ' ' ) } )</td>`;
                chainsText += `<td align="center">(${ orbit.sum.join( ', ' ) })</td>`;
                chainsText += `<td align="center">${ orbitIdSum / orbitSpaceGcd } * ${ orbitSpaceGcd }</td>`;
            }
        } else {
            if ( isSelfConjugate && conj ) {
                // self-conjugates pair off so must have even order
                var scValence = orbit.valence.slice( 0, Math.ceil( orbit.valence.length / 2 ) );
                var scMembersFirst = orbit.coords.slice( 0, Math.ceil( orbit.coords.length / 2 ) );
                var scMembersRest = orbit.coords.slice( Math.ceil( orbit.coords.length / 2 ), orbit.coords.length );

                chainsText += `<td align="center" class='midi' style='display: ${midi?"":"none"};'>${ scValence }</td>`;
                chainsText += `<td id="${ tableId }.${ orbit.index }" class='orbit' align='center' onclick="${ cellClick }">${ scMembersFirst.join( C_SEP ) } &#8600;<br/>${ scMembersRest.join( C_SEP ) } &#8598;</td>`;
                chainsText += `<td align="center">(${ orbit.sum.join( ', ' ) })</td>`;
                chainsText += `<td align="center">${ orbitIdSum / orbitSpaceGcd } * ${ orbitSpaceGcd }</td>`;
            } else if ( isFirstConjugate && conj ) {
                var conjOrbit = orbits[ orbit.conjugate.index - 1 ];
                var conjOrbitIdSum = conjOrbit.getIdSum();
                var conjOrbitSpaceGcd = gcd( maxIndex, conjOrbitIdSum );
                chainsText += `<td align="center" class='midi' style='display: ${midi?"":"none"};'>${ orbit.valence.join( C_SEP ) }</td>`;
                chainsText += `<td id="${ tableId }.${ orbit.index }.${ conjOrbit.index }" class='orbit' align='center' onclick="${ cellClick }">${ orbit.getMembers() }<br/>${ conjOrbit.getMembers() }</td>`;
                chainsText += `<td align="center">(${ orbit.sum.join( ', ' ) })<br/>(${ conjOrbit.sum.join( ', ' ) })</td>`;
                chainsText += `<td align="center">${ orbitIdSum / orbitSpaceGcd } * ${ orbitSpaceGcd }<br/>${ conjOrbitIdSum / conjOrbitSpaceGcd } * ${ conjOrbitSpaceGcd }</td>`;
            } else {
                chainsText += `<td align="center" class='midi' style='display: ${midi?"":"none"};'>${ orbit.valence.join( C_SEP ) }</td>`;
                chainsText += `<td id="${ tableId }.${ orbit.index }" class='orbit' align='center' onclick="${ cellClick }">${ orbit.getMembers() }</td>`;
                chainsText += `<td align="center">(${ orbit.sum.join( ', ' ) })</td>`;
                chainsText += `<td align="center">${ orbitIdSum / orbitSpaceGcd } * ${ orbitSpaceGcd }</td>`;
            }
        }

        if ( isSelfConjugate && conj ) {
            chainsText += `<td align="center">${ orbit.order / 2 }</td>`;
        } else if ( isFirstConjugate && conj ) {
            chainsText += `<td align="center">${ orbit.order }</td>`;
        } else {
            chainsText += `<td align="center">${ orbit.order }</td>`;
        }
        chainsText += `<td align="center">${ orbit.harmonic }</td>`;
        chainsText += `<td align="center">${ orbit.getLineRef() }</td>`;
        chainsText += `<td align="center">${ orbit.centreRef }</td>`;
        chainsText += `<td align="center">${ orbit.perimeter }</td>`;
        chainsText += `<td align="center">${ truncate( orbit.attack, 1000 ) }</td>`;
        chainsText += `<td align="center">( ${ orbit.gcd }, ${ orbit.lcm } )</td>`;
        chainsText += `<td align="center">${ formattedWeight( orbit.bias ) }</td>`;
        chainsText += "</tr>";
    }

    var tds = orbitSystem.box.sum;
    var tis = orbitSystem.box.indexSum;
    var tisGcd = gcd( maxIndex, tis );
    var tos = orbitSystem.totalOrderSpace;

    chainsText += "<tr>";
    chainsText += "<td></td>";
    chainsText += `<td colspan='5' class='midi' style='display: ${midi?"":"none"};'></td>`;
    chainsText += "<td colspan='1'></td>";
    chainsText += `<td class="sum-total" onclick="${ totalClick }"><span class="sum-total">( ${ tds.join( ', ') } )</span></td>`;
    chainsText += `<td class="sum-total" onclick="${ totalClick }"><span class="sum-total">${ tis / tisGcd } * ${ tisGcd }</span></td>`;
    chainsText += `<td class="sum-total" onclick="${ totalClick }"><span class="sum-total">( ${ tos } )</span></td>`;
    chainsText += "<td colspan='8'></td>";
    chainsText += "</tr>";
    chainsText += "</table>";

    var legend = "Click on a cell to select/deselect or on a totals cell to draw all.";
    chainsText += `<div class='chain-details-legend' class='noprint'>${ legend }</div>`;

    var sortColumn = [0];
    const existingTable = document
        .getElementById( tableId );

    if (existingTable && existingTable.dataset && existingTable.dataset.sortColumn ) {
        sortColumn = existingTable
            .dataset
            .sortColumn
            .split("\\s*,\\s*")
            .map( x => Number( x ) );
    }

    document
        .getElementById( tableContainerId )
        .innerHTML = chainsText;

    try {
        sortTable( tableId, sortColumn, true, true );
    } catch ( e ) {
        console.log(e);
    }
}
