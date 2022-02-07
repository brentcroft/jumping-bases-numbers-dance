



// https://codegolf.stackexchange.com/questions/104665/coprimes-up-to-n
var getCoprimesLessThan = ( n ) => [ ...Array( n ).keys() ]
    .filter( b => ( g = a => b ? g( b, b = a % b ) : a < 2 )( n ) )
    .slice( 1 );

function getClockfaces( terminal, coprime ) {

    const identity = [ ...Array( terminal ).keys() ];
    const clockfaces = [ identity ];

    const strideClockface = ( clockface, stride ) => identity.map( i => clockface[ ( i * stride ) % terminal ] );
    const exactlyEquals = (a, b) => a.filter( (x,i) => x == b[i] ).length == a.length;

    var clockface = strideClockface( identity, coprime );
    while ( !exactlyEquals( identity, clockface ) ) {
        clockfaces.push( clockface );
        clockface = strideClockface( clockface, coprime );
    }

    return clockfaces;
}

function getOrbits( roots ) {
    const orbits = [];

    const identity = roots[0];
    const tally = [...identity];
    const terminal = identity.length;

    identity.forEach( i => {
        if ( tally.includes( i ) ) {
            // take the i th item from each clockface
            // todo: removing duplicate sequences
            const orbit = roots.map( root => root[i] ).filter( (v, i, a) => a.indexOf( v ) === i );
            orbit.forEach( i => tally.splice( tally.indexOf( i ), 1 ) );
            orbits.push( orbit );
        }
    } );

    return orbits;
}

function monomialHtml( monomial ) {
     const identities = Object
        .entries( monomial )
        .filter( entry => Number( entry[ 0 ] ) == 1 )
        .map( entry => `(<code>e</code><sup>${ entry[ 1 ].length }</sup>) ` )
        .join( '' );
     const orbits = Object
        .entries( monomial )
        .filter( entry => Number( entry[ 0 ] ) > 1 )
        .map( entry => `<i>a</i><sup>${ entry[ 1 ].length }</sup><sub style='position: relative; left: -.5em;'>${ entry[ 0 ] }</sub>` )
        .join( '' );
     return identities + orbits;
}

function equalCycle( o1, o2 ) {
    const l = o2.length;
    if ( o1.length != l ) {
        return false;
    } else {
        const offset = o2.indexOf( o1[0] );
        for ( var i = 0; i < l; i++ ) {
            const [ a, b ] = [ o1[i], o2[ ( i + offset ) % l ] ];
            if ( a != b ) {
                return false;
            }
        }
        return true;
    }
}

function equalCycles( cycles1, cycles2 ) {
    const l = cycles2.length;
    if ( cycles1.length != l ) {
        return false;
    }
    const eq = cycles1
       .map( cycle1 => cycles2
           .map( cycle2 => equalCycle( cycle1, cycle2 ) )
           .filter( e => e )
           .length > 0 )
        .filter( e => e );

    return l == eq.length;
}


function reverseCycle( o1, o2 ) {
    const l = o2.length;
    if ( o1.length != l ) {
        return false;
    } else {
        const offset = o2.indexOf( o1[0] );
        if ( offset < 0 ) {
            return false;
        }
        for ( var i = 0; i < l; i++ ) {
            const [ a, b ] = [ o1[i], o2[ ( l + offset - i ) % l ] ];
            if ( a != b ) {
                return false;
            }
        }
        return true;
    }
}

function cycleExponential( cycle, exponent ) {
    if ( exponent < 0 ) {
        const inverseCycle = [ ...cycle ].reverse();
        if ( exponent == -1 ) {
            return [ inverseCycle ];
        } else {
            return cycleExponential( inverseCycle, -1 * exponent, true )
        }
    }
    const l = cycle.length;
    const tally = new Array( exponent ).fill( 0 );
    return ( l % exponent ) == 0
        ? tally.map( (_, e) => cycle.filter( (x,i) => (i % exponent) == e ) )
        : [ cycle.map( (x,i) => cycle[ (exponent * i) % l ] ) ];
}

function cyclesExponential( cycles, exponent ) {
    return cycles.flatMap( cycle => cycleExponential( cycle, exponent ) );
}


class Orbitation {
    constructor( bases ) {
        this.bases = bases;
        this.volume = bases.reduce( ( a, c ) => a * c, 1 );
        this.terminal = this.volume - 1;
        this.coprimes = getCoprimesLessThan( this.terminal );

        this.fragments = {};

        this.roots = this.coprimes.map( coprime => {
            const clockfaces = getClockfaces( this.terminal, coprime );
            const orbits = getOrbits( clockfaces );

            orbits.sort( ( o1, o2 ) => o1.length - o2.length );

            const monomial = {};
            const conomial = {};

            orbits.forEach( orbit => {

                const key = orbit.length;
                if ( key in monomial ) {
                    monomial[ key ].push( orbit );
                } else {
                    monomial[ key ] = [ orbit ];
                }

                if ( !( key in this.fragments ) ) {
                    this.fragments[ key ] = [];
                }

                const keyFragments = this.fragments[ key ];

                const matchingFragments = keyFragments
                    .map( ( f,i ) => [ i, f, reverseCycle( f, orbit ), equalCycle( f, orbit ) ] )
                    .filter( f => f[2] || f[3] )
                    .map( ([ i, f, r, e ]) => [ i, !e, f ] );

                if ( matchingFragments.length < 1 ) {
                    matchingFragments.push( [ keyFragments.length, false, orbit ] );
                    this.fragments[ key ].push( orbit );
                }

                if ( key in conomial ) {
                    conomial[ key ].push( matchingFragments.map( mf => mf[0] ) );
                } else {
                    conomial[ key ] = [ matchingFragments.map( mf => mf[0] ) ];
                }

            } );

            return [
                coprime,
                monomial,
                conomial
            ];
        } );

        function getMatchingRoots( roots, cycles, coprime ) {
            const matchingRoots = roots
                .filter( ( [ coprime2, monomial2, _ ] ) => {
                    const cycles2 = Object.values( monomial2 ).flatMap( c => c );
                    return equalCycles( cycles, cycles2 );
                } );

            return matchingRoots;
        }

        this.symbols = this.roots
            .flatMap( ( [ coprime, monomial, _ ] ) => {

                const cycles = Object.values( monomial ).flatMap( c => c );

                const expMatches = [ -1, 2, 3 ]
                    .map( exponent => {
                        const expCycles = cyclesExponential( cycles, exponent );

                        const matchingRoots = getMatchingRoots( this.roots, expCycles );

                        if ( matchingRoots.length > 0 ) {
                            const expCoPrime = Math.min( matchingRoots.map( r => r[0] ) );
                            return [ coprime, exponent, expCoPrime ];
                        } else {
                            return [];
                        }
                    } );

                return expMatches;
            } )
            .filter( x => x.length > 0  )
            .reduce( ( a, [ coprime, exponent, expCoPrime ] ) => {
                const ref = [ coprime, exponent ];
                if ( expCoPrime in a ) {
                    a[ expCoPrime ].push( ref );
                } else {
                    a[ expCoPrime ] = [ ref ];
                }
                return a;
            }, {} );
    }

    fragmentsBlock() {
        const fragments = Object
            .entries( this.fragments )
            .map( f => `${ f[0] } ( ${ f[1].length } ) = ( ${ f[1].map( o => o.join(" ") ).join(" ), ( ") } )` )
            .join( "\n" );
        return `<pre>${ fragments }</pre>`;
    }

    symbolsTable() {

        const tableId = `symbols-${ this.volume }`;

        const header = [
            [ "coprime", 'text' ],
            [ "match", 'text' ]
        ];

        const rows = Object
            .entries( this.symbols )
            .map( ( [ coprime, refs ] ) => [ coprime, refs.map( ref => `${ ref[ 0 ] }<sup>${ ref[ 1 ] }</sup>` ).join( ', ' ) ] );

        return `<div class="floatLeft"><table id="${ tableId }" class='sortable symbol-details'>`
            + `<caption>Symbols</caption>`
            + "<tr>" + header.map( (h,i) => `<th onclick='sortTable( "${ tableId }", ${ i }, "${ h[ 1 ] }" )'>${ h[0] }</th>` ).join( "\n" ) + "</tr>"
            + rows.map( row => "<tr>" + row.map( r => `<td>${ r }</td>` ).join( "\n" ) + "</tr>" ).join( "\n" )
            + "</table></div>";
    }

    htmlTable() {

        const tableId = `system-${ this.volume }`;

        const header = [
            ["coprime", 'number' ],
            ["monomial", 'text' ],
//            ["conomial", 'text' ],
            ["cycles", 'cycles' ]
        ];

        const rows = this
            .roots
            .map( root => [
                root[0],
                monomialHtml( root[1] ),
                "<div class='cycles'>" + Object
                    .entries( root[1] )
                    .map( ( [ key, orbits ] ) => `${ key } * ${ orbits.length } = ` + orbits.map( orbit => `( ${ orbit.join( ' ' ) } )` ).join( '' ) )
                    .map( orbitsRow => `<span>${ orbitsRow }</span>` )
                    .join( '<br/>\n' )
                + "</div>"
            ] );

        const fragmentsCount = Object.values( this.fragments ).reduce( (a,c) => a + c.length, 0 );
        const orbitsCount = this.roots.reduce( ( a, root ) => a + Object.values( root[2] ).reduce( ( b, orbits ) => b + orbits.length, 0 ), 0 );

        return `<table id="${ tableId }" class='sortable symbol-details'>`
            + `<caption>Orbitation: [ ${ this.bases.join( ', ' ) } ], terminal: ${ this.terminal }, fragments: ${ fragmentsCount }, orbits: ${ orbitsCount }</caption>`
            + "<tr>" + header.map( (h,i) => `<th onclick='sortTable( "${ tableId }", ${ i }, "${ h[ 1 ] }" )'>${ h[0] }</th>` ).join( "\n" ) + "</tr>"
            + rows.map( row => "<tr>" + row.map( r => `<td>${ r }</td>` ).join( "\n" ) + "</tr>" ).join( "\n" )
            + "</table>";
    }

    x3domGroup() {

        const rows = Object
            .entries( this.symbols )
            .map( ( [ coprime, refs ] ) => [ coprime, refs.map( ref => `${ ref[ 0 ] }<sup>${ ref[ 1 ] }</sup>` ).join( ', ' ) ] );

        const coord = () => 2 * ( 0.5 - Math.random() );
        const points = [];
        this
            .roots
            .map( root => points.push( {
                'coprime': root[0],
                'monomial': monomialHtml( root[1] ),
                'coord': [ coord(), coord(), coord() ]
            } ) );

        // build links between points
        const getPoint = ( coprime ) => points.filter( p => p.coprime == coprime )[0];

        points.forEach( point => {
            point.links = this
                .symbols[ point.coprime ]
                .map( ( [ c, exp ] ) => [ getPoint( c ), exp ] );
        } );

        const linkColor = ( exp ) => ( exp == -1 )
            ? "black"
            : ( exp == 2 )
                ? "blue"
                : ( exp == 3 )
                    ? "green"
                    : "red";


        // build x3dom shapes and links
        points
            .forEach( p => {

                // [ linkPoint, exp, transform@translation, transform@rotation, cylinder@height  ]
                p.shapeLinks = p.links
                    .map( ( [ linkPoint, exp ] ) => [
                        linkPoint,
                        exp,
                        // returns [ transform@translation, transform@rotation, cylinder@height  ]
                        ...createCylinder( p, linkPoint, linkColor( exp ) ) ] );

                p.shape = reify(
                    "transform",
                    { "translation": p.coord.join( ' ' ) },
                    [
                        createSphereShape( `coprime-${ p.coprime }`, "0.1", "red", 0, `${ p.coprime } | ${ p.monomial }`, true ),
                        ...p.shapeLinks.map( sl => sl[2] )
                    ] )
            } );

        return points;
    }

}




function twist( sequence, stride = 2 ) {
    const base = sequence.length;
    const tally = new Array( base ).fill( 0 );
    const sink = [];
    for ( var i = 0; i < base; i++ ) {
        const j = ( i * stride ) % base;
        if (tally[ j ] ) {
            throw new Error( `Common Factor: Index length ${ base } at stride ${ stride } repeats with length ${ sink.length }; [${ sink }]  ` );
        }
        tally[ j ] = 1;
        sink.push( sequence[ j ] );
    }
    return sink
}

function roots( index, stride ) {
    const source = [...index];
    const base = source.length;

    // no twists below three
    if ( base <= 2 ) {
        return [ source ];
    }

    const currentRoots = [ index ];
    var locus = twist( index, stride );
    while ( !arrayExactlyEquals( index, locus ) ) {
        currentRoots.push( locus );
        locus = twist( locus, stride );
    }
    return currentRoots;
}

function winding( sequence ) {
    const w = sequence
        .reduce(
            (a,c) => [ a[0] + (c < a[1] ? 1 : 0 ), c ],
            [ 1, 0 ]
        );
    return w[0];
}

function rootsInfo( base, stride ) {
    //const r = roots( arrayOfIndexes( base ), stride );
    const r = getClockfaces(  base, stride );
    const w = r.map( sequence => winding( sequence ) );
    return { base: base, stride: stride, size: r.length, windings: w, roots: r  };
}

