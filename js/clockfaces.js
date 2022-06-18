
const pointId = ( point ) => point.id;
const pointCoord = ( point ) => `(${ point.coord.join( "," ) })`;
const pointLabel = pointId;


function getClockfaces( terminal, stride ) {

    const identity = [ ...Array( terminal ).keys() ];
    const clockfaces = [ identity ];

    const strideClockface = ( clockface, stride ) => identity.map( i => clockface[ ( i * stride ) % terminal ] );
    const exactlyEquals = (a, b) => a.filter( (x,i) => x == b[i] ).length == a.length;

    var clockface = strideClockface( identity, stride );
    while ( !exactlyEquals( identity, clockface ) ) {
        clockfaces.push( clockface );
        clockface = strideClockface( clockface, stride );
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

    return orbits
        .map( orbit => orbit
            .map( ( c, i ) => {
                 return {
                    id: c,
                    di: orbit[ ( i + 1 ) % orbit.length ],
                    coord: [ c ],
                    toString: () => c
                };
            } )
        );
}



function createPoint( i, j, coprime, cofactor ) {
    const point = {
         id: j + ( i * coprime ),
         di: ( j * cofactor ) + i,
         coord: [ i, j ]
    };
    point.toString = () => pointLabel( point );
    return point;
}

function stubNextPoint( lastPoint, cofactor, terminal ) {
    const point = {
        id: lastPoint.di,
        di: ( lastPoint.di * cofactor ) % terminal,
        coord: []
    };
    point.toString = () => pointLabel( point );
    return point;
}

function getBoxGroupMember( volume, coprime ) {
    const cofactor = ( volume / coprime );
    if ( !Number.isInteger( cofactor ) ) {
        throw new Error( `Volume ${ volume } is not a truncated box with side ${ coprime }.` );
    }
    const terminal = volume - 1;
    const cycles = [];

    for ( var i = 0; i < cofactor; i++ ) {
        for ( var j = 0; j < coprime; j++ ) {

            const point = createPoint( i, j, coprime, cofactor );
            const cycle = cycles.find( cycle => cycle.find( p => p.id == point.id ) );

            if ( cycle ) {
                cycle
                    .find( p => p.id == point.id )
                    .coord
                    .push( i, j );
            } else {
                const newCycle = [ point ];
                var lastPoint = point;
                var nextPoint = stubNextPoint( lastPoint, cofactor, terminal );
                while ( nextPoint.id != point.id ) {
                    newCycle.push( nextPoint );
                    lastPoint = nextPoint;
                    nextPoint = stubNextPoint( lastPoint, cofactor, terminal );
                }
                cycles.push( newCycle );
            }
        }
    };
    return cycles;
}

function magnifyPoint( c, magnification ) {
    const point = {
        id: c.id * magnification,
        di: c.di * magnification,
        coord: [ ...c.coord ]
    };
    point.toString = () => pointLabel( point );
    return point;
}

function offsetPoint( c, k, volume = 1 ) {
    const point = {
        id: ( c.id + ( k * volume ) ),
        di: ( c.di + ( k * volume ) ),
        coord: [ ...c.coord, k ]
    };
    point.toString = () => pointLabel( point );
    return point;
}

function expandCycles( cycles, copies = 1, harmonic = false ) {
    if ( copies < 2 ) {
        return cycles;
    }

    const volume = cycles.reduce( ( a, c ) => a + c.length, 0 );
    const baseCycles = [];

    if ( harmonic ) {
        const template = cycles.map( cycle => cycle.map( c => magnifyPoint( c, copies ) ) );
        for ( var k = 0; k < copies; k++ ) {
            template.forEach( cycle => baseCycles.push( cycle.map( c => offsetPoint( c, k ) ) ) );
        }
    } else {
        for ( var k = 0; k < copies; k++ ) {
            cycles.forEach( cycle => baseCycles.push( cycle.map( c => offsetPoint( c, k, volume ) ) ) );
        }
    }
    return baseCycles;
}

function getMultiplicativeGroupMember( terminal, stride, truncated = true ) {

    if ( Number.isInteger( terminal / stride ) ) {
        throw new Error( `Not a Multiplicative Group Member: stride ${ stride } is not coprime to the terminal ${ terminal }` );
    }

    const volume = ( terminal + 1 );
    const cofactor = volume / stride;
    if ( Number.isInteger( cofactor ) ) {
        return getBoxGroupMember( volume, cofactor )
            .filter( cycle => !truncated || !cycle.find( c => c.id == terminal ) );
    } else {
        // one-dimensional
        const cycles = getOrbits( getClockfaces( terminal, stride ) );
        if ( !truncated ) {
            cycles.push( [ {
                id: terminal,
                di: terminal,
                coord: [ terminal ],
                toString: () => terminal
            } ] );
        }
        return cycles;
    }
}

function normaliseCoordinates( cycles, bases ) {
    const canonicalBases = [...bases]
    canonicalBases.sort();
    const perm = canonicalBases.map( b => bases.indexOf( b ) );
    const transformCoord = ( coord ) => perm.map( p => coord[ p ] );
    cycles
        .forEach( cycle => cycle
            .forEach ( point => {
                const newCoord = transformCoord( point.coord );
                point.coord = newCoord;
            }) )
}

function getCycles( factors, copies = 1, harmonic = false, truncated = true ) {
    const [ coprime, cofactor ] = factors;
    const volume = factors.reduce( ( a, c ) => a * c, 1 );
    const terminal = volume - 1;
    const cycles = getMultiplicativeGroupMember( terminal, coprime, truncated );
    const expandedCycles = expandCycles( cycles, copies, harmonic );

    normaliseCoordinates( expandedCycles, [ coprime, cofactor,  copies ] );

    return expandedCycles;
}

function isCycles( value ) {
    if ( Array.isArray( value ) && value.length > 0 ) {
        const firstCycle = value[0];
        if ( Array.isArray( firstCycle ) && firstCycle.length > 0 ) {
            const firstPoint = firstCycle[0];
            return firstPoint.id >= 0 && firstPoint.di >= 0;
        }
    }
    return false;
}

function formatCycles( cycles ) {
    return cycles.map( cycle => "(" + cycle.map( p => p.id ).join(',') + ")" ).join( '' );
}

