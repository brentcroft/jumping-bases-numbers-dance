
randomSystems = [];
chainSystems = [];
maxI = -1;
maxJ = -1;

const C_SEP = " ";

function hasChainSystem( i, j ) {
    return (i in chainSystems ) && (j in chainSystems[i]);
}

function truncate( value, places = 100 ){
    return Math.round( places * value ) / places;
}

function totalDigitSum( b, m ) {
    return [ ( m * b * ( m - 1 ) ) / 2, ( m * b * ( b - 1 ) ) / 2 ];
}

const PI = 3.1415926;
const TWO_PI = 2 * PI;

/*
    Randomize array in-place using Durstenfeld shuffle algorithm
    https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
*/
function shuffleArray( array ) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

function entryRotation( entryLeft, entry, entryRight ) {

    var x00 = entryLeft.coord[0]
    var y00 = entryLeft.coord[1]
    var x01 = entry.coord[0]
    var y01 = entry.coord[1]
    var x10 = x01
    var y10 = y01
    var x11 = entryRight.coord[0]
    var y11 = entryRight.coord[1]

    var dx0  = x01 - x00;
    var dy0  = y01 - y00;
    var dx1  = x11 - x10;
    var dy1  = y11 - y10;

    var angle = Math.atan2(
        (dx0 * dy1) - (dx1 * dy0),
        (dx0 * dx1) + (dy0 * dy1)
    );

    // count as rotate clockwise by PI
    if ( Math.abs( Math.PI - angle ) < 0.00001 ) {
        angle = -1 * Math.abs( angle );
    } else if (angle > 0) {
        //angle -= 2 * Math.PI;
    }

    return angle;
}

function entryRotation2( entryLeft, entry, entryRight ) {

    var a1 = Math.atan2( entryLeft.coord[1] - entry.coord[1], entryLeft.coord[0] - entry.coord[0] );
    var a2 = Math.atan2( entryRight.coord[1] - entry.coord[1], entryRight.coord[0] - entry.coord[0] );

    var angle = a2 - a1;

    if (angle < 0) {
        angle += 2 * Math.PI;
    }

    return angle;
}

function entryLengthSquared( entry, entryRight ) {
    const yd = ( entryRight.coord[1] - entry.coord[1] );
    const xd = ( entryRight.coord[0] - entry.coord[0] );
    const zd2 = xd**2 + yd**2;
    return zd2;
}

function digitalDistance( base, mult, entry, entryRight ) {
    const yd = ( entryRight.coord[1] - entry.coord[1] );
    const xd = ( entryRight.coord[0] - entry.coord[0] );
    const zd2 = Math.abs(xd) + Math.abs(yd);
    return zd2;
}

function chainRotationAndPerimeter( base, mult, points ) {
    var rotation = 0;
    var perimeter = 0;
    var digitalPerimeter = 0;

    for ( var i = 0, d = points.length; i < d; i++ ) {
        rotation += entryRotation(
            points[ ( d + i - 1 ) % d ],
            points[ i ],
            points[ ( i + 1 ) % d ]
        );
        perimeter += entryLengthSquared( points[ i ], points[ ( i + 1 ) % d ] );
        digitalPerimeter += digitalDistance( base, mult, points[ i ], points[ ( i + 1 ) % d ] );
    }
    // number of whole clockwise turns
    return [ -1 * Math.round( rotation / TWO_PI ), perimeter, digitalPerimeter ];
}


function formattedWeight( weight ) {
    return ( weight[0] == 0 )
            ? 0
            : ( weight[0] == weight[1] || weight[2] == 0 )
                ? 1
                : ( weight[0] / weight[2] ) + " / " + ( weight[1] / weight[2] );
}

function getFundamental( chains ) {
    var fundamental = 1;
    for ( var i = 0; i < chains.length; i++ ) {
        var chain = chains[i];
        var hI = chain.points.length;
        if ( hI > fundamental ) {
            fundamental = hI;
        }
    }
    return fundamental;
}


function navigate( origin=[ 0, 0 ], chainSystem ) {

    const id = ( i, j ) => j + ( i * chainSystem.base );
    const di = ( i, j ) => i + ( j * chainSystem.mult );
    const xid = ( id ) => [ Math.trunc( id / chainSystem.base ), id % chainSystem.base ];
    const xdi = ( di ) => [ di % chainSystem.mult, Math.trunc( di / chainSystem.mult ) ];

    const idx = [];
    const dix = [];

    var path = [];
    var chain = [];

    var c = origin;

    var cid = id( c[0], c[1] );
    var cdi = di( c[0], c[1] );
    idx[cid] = c;
    dix[cdi] = c;
    path.push( c );

    //c = xdi( cid );
    c = xid( cdi );
    cid = id( c[0], c[1] );
    cdi = di( c[0], c[1] );

    while (!( cid in idx && cdi in dix )) {
        idx[cid] = c;
        dix[cdi] = c;
        path.push( c );
        //c = xdi( cid );
        c = xid( cdi );
        cid = id( c[0], c[1] );
        cdi = di( c[0], c[1] );
    }

    // backtrack path to first dixv extracting terminal chain
    const pairedItem = path.pop();
    chain.push( pairedItem );
    cid2 = id( pairedItem[0], pairedItem[1] );
    while ( cid2 != cid ) {
        c = path.pop();
        chain.push( c );
        cid2 = id( c[0], c[1] );
    }

    //path.push( pairedItem );
    path.push( c );

    return [ path, chain.reverse() ];
}

function appendChainToCycleIndex( chain, cycleIndex = [] ){
    var l = chain.length;
    cycleIndex[l] = ( l in cycleIndex ) ? cycleIndex[l] + 1 : 0
}

function getNthHarmonicNumber( n ) {
    var s = 0.0;
    for( var i = 1; i <= n; i++) {
        s = s + 1 / i;
    }
    return s;
}

function getChainSystemSummary() {
    return `( ${ this.base }, ${ this.mult }, ${ this.fundamental }, ${ this.chains.length } )`;
}

function buildChainSystem( base, mult, chains ) {

    function getTableRow() {
        return {
            "sum": `( ${ this.sum[0] }, ${ this.sum[1] } )`,
            "harmonicSum": `( ${ this.harmonicSum[ 0 ] }, ${ this.harmonicSum[ 1 ] } )`,
            "gcd": this.gcd,
            "harmonic": this.harmonic,
            "length": this.length,
            "weight": this.weight,
            "bias": formattedWeight( this.bias ),
            "members": this.points.join(C_SEP),
            "rotation": this.rotation,
            "perimeter": this.perimeter,
            "digitalPerimeter": this.digitalPerimeter
        };
    }


    const maxIndex = (base * mult) - 1;

    var totalHarmonicSum = [ 0, 0 ];
    var totalWeight = 0;
    var totalRotation = 0;
    var totalPerimeter = 0;
    var totalDigitalPerimeter = 0;

    const fundamental = getFundamental( chains );

    const maxChainWeight =  reduce(
            ( base - 1 ) * fundamental,
            ( mult - 1 ) * fundamental
        )[2];

    const cycleIndexMonomial  = {};

   // calculate harmonics
    var harmonics = {};
    for ( var i = 0; i < chains.length; i++ ) {
        var chain = chains[i];
        var hI = chain.points.length;
        harmonics[ hI ] = ( hI in harmonics ) ? ( harmonics[ hI ] + 1 ) : 1;

        var harmonic = fundamental / hI;

        const [ sumX, sumY, gcd ] = chainMedian( chain );
        const [ rotation, perimeter, digitalPerimeter ] = chainRotationAndPerimeter( base, mult, chain.points );

        cycleIndexMonomial[hI] = ( hI in cycleIndexMonomial ) ? cycleIndexMonomial[hI] + 1 : 1

        chain.length = hI,
        chain.harmonic =  harmonic;
        chain.sum = [ sumX, sumY ];
        chain.centre = [ sumX / hI, sumY / hI ];
        chain.harmonicSum = [ harmonic * sumX, harmonic * sumY ];
        chain.gcd =  gcd;
        chain.weight = gcd * harmonic;
        // [ gcd * harmonic, maxChainWeight, gcd( (gcd * harmonic), maxChainWeight ) ]
        chain.bias = reduce( gcd * harmonic, maxChainWeight );
        chain.biasFactor = ( chain.bias[0] / chain.bias[1] );
        chain.rotation = rotation;
        chain.perimeter = perimeter;
        chain.digitalPerimeter = digitalPerimeter;

        totalHarmonicSum[0] += chain.harmonicSum[0];
        totalHarmonicSum[1] += chain.harmonicSum[1];

        totalRotation += chain.rotation;
        totalPerimeter += chain.perimeter;
        totalDigitalPerimeter += chain.digitalPerimeter;
        totalWeight += chain.weight;

        chain.getTableRow = getTableRow;
    }

    Object.entries( cycleIndexMonomial ).sort( (a, b) => a < b );

    return {
        base: base,
        mult: mult,
        hypo: Math.sqrt( base**2 + mult**2 ),
        chains: chains,
        totalDigitSum: totalDigitSum( base, mult ),
        totalHarmonicSum : totalHarmonicSum,
        totalRotation : totalRotation,
        totalPerimeter : totalPerimeter,
        totalDigitalPerimeter: totalDigitalPerimeter,
        harmonics: harmonics,
        maxIndex: maxIndex,
        fundamental: fundamental,
        totalWeight: totalWeight,
        maxWeight: maxChainWeight,
        cycleIndexMonomial: cycleIndexMonomial
    };
}

function buildIndexes( base, mult, id, di ) {

    function coord_text() {
        return `( ${ this.coord[0] }, ${ this.coord[1] } )`;
    }

    const [ idx, dix ] = [ [], [] ];
    for ( var i = 0; i < mult; i++) {
        for ( var j = 0; j < base; j++) {
            const gridPoint = {
                coord: [ i, j ],
                id: id( i, j ),
                di: di( i, j ),
                toString: coord_text
            };
            idx[ gridPoint.id ] = gridPoint;
            dix[ gridPoint.di ] = gridPoint;
        }
    }
    return [ idx, dix ];
}

function buildChains( base, mult, idx, dix ) {

    function coords_array() {
        var coordsArray = [];
        for ( var i = 0; i < this.points.length; i++) {
            coordsArray.push( this.points[ i ].coord );
        }

        return coordsArray;
    }

    const chains = [];

    // build each chain by iterating (and dixxing) the items
    for ( var i = 0; i < ( base * mult ); i++) {

        if ( dix[ i ] == -1 ) {
            continue;
        }

        dix[ i ] = -1;

        var gridPoint = idx[ i ];

        const chain = {
            index: i,
            points: [ gridPoint ],
            coordsArray: coords_array
        };

        const points = chain.points;

        while ( gridPoint.di != i ) {
            dix[ gridPoint.di ] = -1;
            gridPoint = idx[ gridPoint.di ];
            points[ points.length ] = gridPoint;
        }

        chains.push( chain );
    }

    return chains;
}


/*
    Build the orbits for base and mult.
*/
function getChainSystem( base, mult ) {

    if ( hasChainSystem( base-2, mult-2 ) ) {
        return chainSystems[ base-2 ][ mult-2 ];
    }

    const id = ( i, j ) => ( i * base ) + j;
    const di = ( i, j ) => i + ( j * mult );

    const [ idx, dix ] = buildIndexes( base, mult, id, di );
    const chains = buildChains( base, mult, idx, dix );

    const chainSystem = buildChainSystem( base, mult, chains );

    chainSystem.toString = getChainSystemSummary;

    chainSystem.C = chainDown( chainSystem.chains[1], mult );
    chainSystem.D = chainUp( chainSystem.chains[1], base );


    var i = base-2;
    var j = mult-2;

    if ( ! ( i in chainSystems ) ) {
        chainSystems[i] = [];
    }

    maxI = Math.max( maxI, i );
    maxJ = Math.max( maxJ, j );

    chainSystems[i][j] = chainSystem;

    return chainSystem;
}

function getRandomIndexValues( base, mult, id ){
    const randomIndexValues = [];
    for ( var i = 0; i < mult; i++) {
        for ( var j = 0; j < base; j++) {
            randomIndexValues.push( id( i, j ) );
        }
    }
    shuffleArray( randomIndexValues );
    return randomIndexValues;
}

/*
    Random orbits for base and mult.
*/
function getRandomSystem( chainSystem ) {

    const [ base, multi, svg ]  = [ chainSystem.base, chainSystem.mult, chainSystem.svg];

    const id = ( i, j ) => ( i * base ) + j;

    const randomIndexValues = getRandomIndexValues( base, mult, id );
    const di = ( i, j ) => randomIndexValues[ id( i, j ) ];

    const [ idx, dix ] = buildIndexes( base, mult, id, di );
    const chains = buildChains( base, mult, idx, dix );

    const randomChainSystem = buildChainSystem( base, mult, chains );

    randomChainSystem.toString = getChainSystemSummary;

    randomChainSystem.base = base;
    randomChainSystem.mult = mult;
    randomChainSystem.svg = svg;

    return randomChainSystem;
}





// Reduce a fraction by finding the Greatest Common Divisor and dividing by it.
// https://stackoverflow.com/questions/4652468/is-there-a-javascript-function-that-reduces-a-fraction

function reduce( n, d ){
    if ( n == 0 || d == 0 ) {
        return [n,d,0];
    }
    var numerator = (n<d)?n:d;
    var denominator = (n<d)?d:n;
    var gcd = function gcd(a,b){
        return b ? gcd(b, a%b) : a;
    };
    gcd = gcd( numerator,denominator);
    return [ n, d, gcd ];
}

function chainMedian( chain ) {
    var median = [ 0, 0 ];
    chain.points.forEach( ( item, index ) => {
        median[0] += item.coord[0];
        median[1] += item.coord[1];
        } );

    return reduce( median[0], median[1] );
}

/*
    Calculate the value obtained by:
    iterating forward over the chain,
    accumulating the product of the [0] coord and mult.
*/
function chainDown( chain, mult) {
    var bm = 0;
    for ( var i = 0; i < ( chain.points.length - 1 ); i++) {
        // just the base values * mult
        bm = (bm + chain.points[i].coord[0] ) * mult;
    }
    bm += chain.points[ chain.points.length - 1 ].coord[0];
    return bm;
}

/*
    Calculate the value obtained by:
    iterating backward over the chain,
    accumulating the product of the [1] coord and base.
*/
function chainUp( chain, base ) {
    var mb = 0;
    for ( var i = ( chain.points.length - 1 ); i > 0; i--) {
        // just the mult values * base
        mb = (mb + chain.points[i].coord[1] ) * base;
    }
    mb += chain.points[ 0 ].coord[1];
    return mb;
}


function rotateChainText( tdElement, rotateLeft = false ) {

    const chainItems =  arrayFromChainText( tdElement );

    if ( rotateLeft ) {
        chainItems.push( chainItems.shift() );
    } else {
        chainItems.splice( 0, 0, chainItems.pop() );
    }

    var chainText = "";
    chainItems.forEach( coord => {
        chainText += `( ${coord[0]}, ${coord[1]} ) `
        return null;
    });


    tdElement.innerHTML = chainText;
}

function arrayFromChainText( tdElement ) {

    var chainText = tdElement.innerHTML;

    const chainItems =  chainText
        .substring( 1, chainText.length - 1 )
        .split( /\)[^\(]*\(/ );

    var chain = [];

    for ( var i = 0; i < chainItems.length; i++ ) {
        const parts = chainItems[i].trim().split( /[^\d]+/ );
        chain.push( [ Number( parts[0] ), Number( parts[1] ) ] );
    }

    return chain;
}