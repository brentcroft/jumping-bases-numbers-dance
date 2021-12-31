//
function to3D(a) {
    return a.length == 3
         ? a
         : a.length == 2
            ? [ ...a, 0 ]
               : a.length == 1
                ? [ ...a, 0, 0 ]
                : a.slice( 0, 3 );
}

function newMaterial( data = {} ) {
    return reifyData( "material", data );
}


function newAppearance( data = {} ) {
    return reifyData( "appearance", data );
}

function newShape( data = {} ) {
    return reifyData( "shape", data );
}


function createShape( emissiveColor, lineType, attr = {} ) {

    var s = document.createElement('Shape');

    Object.entries( attr ).forEach( x => {
        const [ key, value ] = x;
        s.setAttribute( key, value );
    });

    var app = document.createElement('Appearance');
    var mat = document.createElement('Material');
    if (emissiveColor){
        mat.setAttribute( "emissiveColor", emissiveColor );
    }
    app.appendChild(mat);
    if (lineType) {
        app.appendChild(  reify( "LineProperties", { "linetype": `${ lineType }` } ) );
    }
    s.appendChild(app);
    return s;
}

function createTextShape( text = "", fontStyle ){
    var s = createShape();
    var b = document.createElement( "text" );
    s.appendChild(b);

    b.setAttribute( "string", text );

    if ( fontStyle ) {
        var f = document.createElement( "fontStyle" );
        b.appendChild( f );
        for ( k in fontStyle ) {
            f.setAttribute( k, fontStyle[k] );
        }
    }

    return s;
}

function createPlaneShape( size = "0.1 0 0.1", emissiveColor = "yellow", transparency = 0.95 ) {
    return reify(
        "shape",
        {},
        [
            reify( "appearance", {}, [ reify( "material", { "emissiveColor": emissiveColor, "transparency": transparency } ) ] ),
            reify( "box", { "size": size } )
        ]
    );
}

function createPlaneItem(
        centre = [0,0,0],
        scaleUnit = [1,1,1],
        rotationAxis = [ 0, 0, 0 ],
        rotationAngle = 0,
        size = [1,0,1],
        planeColor = "gray",
        planeTransparency = 0.95 ) {

    return reify(
        "transform",
        {
            "translation": centre.join( ' ' ),
            "scale": scaleUnit.join( ' ' ),
            "class": "orbit-plane"
        },
        [
            reify(
                "transform", { "rotation": rotationAxis.join( ' ' ) + ' ' + rotationAngle },
                [ createPlaneShape( size.join( ' ' ), planeColor, planeTransparency ) ]
            )
        ]
   );
}


function createPlaneItemWithNormal( param ) {

    const {
        centre = [0,0,0],
        planeNormal = [0,1,0],
        scaleUnit = [1,1,1],
        currentDirection = [0,1,0],
        origin = [0,0,0],
        size = [1,0,1],
        planeColor = "gray",
        planeTransparency = 0.95
    } = param;

    const unitNormal = normalize( planeNormal );
    var rotationAxis = unitDisplacement( origin, crossProduct( currentDirection, unitNormal ) );
    var rotationAngle = Math.acos( dotProduct( currentDirection, unitNormal ) );

    const planeItem = createPlaneItem(
                              centre,
                              scaleUnit,
                              rotationAxis,
                              rotationAngle,
                              size,
                              planeColor,
                              planeTransparency);

    planeItem.appendChild(
        reify(
            "group",
            {},
            [ createLineSetFromPoints( [ [0,0,0], unitNormal ], planeColor, "3" ) ]
        )
    );

    planeItem.appendChild(
        reify(
            "transform",
            {
                "translation": unitNormal.join( ' ' ),
                "rotation": rotationAxis.join( ' ' ) + ' ' + rotationAngle
            },
            [ createBoxShape( [0.1, 0.1, 0.1], "black" ) ]
        )
    );
    return planeItem;
}


function createSphereShape( id, radius = "0.1", emissiveColor = "blue", transparency = 0, tooltip, lit = true ) {
    return reify(
        "shape", { },
        [
            reify( "appearance", {}, [ reify( "material", { "emissiveColor": emissiveColor, "transparency": transparency} ) ] ),
            reify( "sphere", { "id": id, "radius": radius, "lit": lit  } )
        ],
        [
            s => {
                if ( tooltip ) {
                    s.setAttribute( "tooltip", tooltip );
                }
            }
        ]
    );
}

function createConeShape( radius = 0.01, height = 0.02, emissiveColor = "blue", transparency = 0 ) {
    return reify(
        "shape", {},
        [
            reify( "appearance", {}, [ reify( "material", { "emissiveColor": emissiveColor, "transparency": transparency} ) ] ),
            reify( "cone", { "bottomRadius": radius, "height": height, "lit": true  } )
        ]
    );
}



function createTorusShape( { outerRadius = 1, size = 0.1, emissiveColor = "blue", transparency = 0, angle = PI, cssClass = "", toggles = {} } = {} ) {
    return reify(
        "shape",
        {
            "class": cssClass
        },
        [
            reify( "appearance", {}, [ reify( "material", { "emissiveColor": emissiveColor, "transparency": transparency } ) ] ),
            reify( "torus", { "innerRadius": size, "outerRadius": outerRadius, "angle": angle, "subdivision": "48,48", "lit": "false" } )
        ],
        []
    );
}

function createBoxShape( size = [0.1, 0.1, 0.1], emissiveColor = "blue", transparency = 0) {
    return reify(
        "shape",
        {},
        [
            reify( "appearance", {}, [ reify( "material", { "emissiveColor": emissiveColor, "transparency": transparency } ) ] ),
            reify( "box", { "size": size } )
        ]
    );
}


function createPolyLineShape( lineSegments, emissiveColor = "red" ){
    var s = createShape( emissiveColor );
    var polyline = document.createElement('Polyline2d');
    s.appendChild(polyline);

    polyline.setAttribute("lineSegments", lineSegments );

    return s;
}

function createLineSetFromPoints( points, emissiveColor, lineType ) {

    if ( points.length == 0 ) {
        return null;
    }

    var shape = createShape( emissiveColor, lineType );
    var lineSet = document.createElement( "lineset" );
    shape.appendChild( lineSet );

    lineSet.setAttribute( 'vertexCount', `${ points.length }` );

    var pointText = "";
    for ( var j = 0; j < points.length; j++ ) {
        pointText += `${ points[j].join( ' ' ) } `;
    }

    var coordinate = document.createElement( 'coordinate' );
    coordinate.setAttribute( 'point', `${ pointText }` );
    lineSet.append( coordinate );

    return shape;
}

function createLineSet( points, emissiveColor, attr = {} ){
    var shape = createShape( emissiveColor, attr.linetype ? attr.linetype : "1", attr );
    var lineSet = document.createElement( "LineSet" );
    shape.appendChild( lineSet );

    lineSet.setAttribute( 'vertexCount', `${ points.length + 1 }` );

    // guarantee 3 values per coord
    var point = points
        .map( (x,i) => {
            var [ x = 0, y = 0, z = 0 ] = x.coord;
            return `${ x } ${ y } ${ z }`;
        } )
        .join( ' ' );

    var [ x = 0, y = 0, z = 0 ] = points[0].coord;
    point += ` ${ x } ${ y } ${ z } -1`;

    var coordinate = document.createElement( 'coordinate' );
    coordinate.setAttribute( 'point', `${ point }` );
    lineSet.append( coordinate );

    return shape;
}

function createBoxAction( a, b, emissiveColor = "red", selected, textLabel, onclick ) {
    // orient from a to b
    // move to midpoint a to b
    // insert cylinder shape
    const origin = [ 0, 0, 0 ];
    const currentDirection = [ 0, 1, 0 ];
    const antiCurrentDirection = [ 0, -1, 0 ];

    const attr = {};

    const height = Math.sqrt( distance2( to3D( b ), to3D( a ) ) );
    const diff = subtraction( to3D( b ), to3D( a ) );
    const centre = addition( to3D( a ), scale( diff, 0.5 ) );
    const quarter = addition( to3D( a ), scale( diff, 0.25 ) );

    const unitNormal = normalize( diff );
    var rotationAxis = unitDisplacement( origin, crossProduct( currentDirection, unitNormal ) );
    var rotationAngle = Math.acos( dotProduct( currentDirection, unitNormal ) );

    const shape = createShape( emissiveColor, attr.linetype ? attr.linetype : "1", attr );

    const shapes = [ shape ];

    shape.appendChild( reify( "cylinder", { "height": height / 2, "radius": 0.015, "lit": false }, [] ) );

    const textShape = createTextShape( textLabel, { "size": 0.12, "solid": "false", "lit": true } );

    const cone = createConeShape( 0.1, 0.16, emissiveColor );

    if ( onclick ) {
        cone.onclick = onclick;
    }

    shapes.push( reify( "transform", { "translation": '0.1 0 0' }, [ textShape ] ) );

    if ( arrayExactlyEquals( currentDirection, a ) && arrayExactlyEquals( antiCurrentDirection, b ) ) {
        shapes.push( cone );
    } else {
        shapes.push( reify( "transform", { "rotation": '1 0 0 ' + PI }, [ cone ] ) );
    }

    return reify(
        "transform",
        { "translation": quarter.join( ' ' ) },
        [
            reify(
                "transform",
                { "rotation": rotationAxis.join( ' ' ) + ' ' + rotationAngle },
                shapes
            )
        ]
      );
}


function createBoxActionShape( left, right, emissiveColor = "red", selected, textLabel ) {
    // orient from a to b
    // move to midpoint a to b
    // insert cylinder shape
    const origin = [ 0, 0, 0 ];
    const currentDirection = [ 0, 1, 0 ];
    const antiCurrentDirection = [ 0, -1, 0 ];

    const attr = {};

    const height = Math.sqrt( distance2( to3D( right ), to3D( left ) ) );
    const diff = subtraction( to3D( right ), to3D( left ) );


    const centre = addition( to3D( left ), scale( diff, 0.5 ) );
    const quarter = addition( to3D( left ), scale( diff, 0.25 ) );

    const translation = [0 ,0, 0 ];


    const unitNormal = normalize( diff );
    var rotationAxis = unitDisplacement( origin, crossProduct( currentDirection, unitNormal ) );
    var rotationAngle = Math.acos( dotProduct( currentDirection, unitNormal ) );

    const shape = createShape( emissiveColor, attr.linetype ? attr.linetype : "1", attr );


    const shapes = [ shape ];

    shape.appendChild( reify( "cylinder", { "height": height, "radius": 0.015, "lit": false }, [] ) );

    const textShape = createTextShape( textLabel, { "size": 0.12, "solid": "false", "lit": true } );

    const cone = createConeShape(
        selected ? 0.1 : 0.05,
        selected ? 0.16 : 0.08,
        emissiveColor );

    const sphere = createSphereShape( ``, 0.1, emissiveColor, 0 );

    //shapes.push( reify( "transform", { "translation": '0.1 0 0' }, [ textShape ] ) );

    const cones = [];
    cones.push( reify( "transform", { "translation": `0 ${ height / 4 } 0` }, [ cone ] ) );

//    if ( !arrayExactlyEquals( left, [ ...right].reverse() ) ) {
//        cones.push( reify( "transform", { "translation": `0 ${ height / 2 } 0` }, [ sphere ] ) );
//    }

    if ( arrayExactlyEquals( currentDirection, left ) && arrayExactlyEquals( antiCurrentDirection, right ) ) {
        shapes.push( reify( "transform", { "rotation": '1 0 0 ' + PI }, cones ) );
    } else {
        shapes.push( ...cones );
    }

    return reify(
        "transform",
        { "translation": translation.join( ' ' ) },
        [
            reify(
                "transform",
                { "rotation": rotationAxis.join( ' ' ) + ' ' + rotationAngle },
                shapes
            )
        ]
      );
}



function getOctahedralItems( boxGroup, param ) {

    const [ p1, p2 ] = boxGroup.box.diagonal.map( p => to3D(p) );
    const maxBase = boxGroup.box.bases.reduce( (a,c) => c > a ? c : a, 0 );

    const scaleUnit = [ 3, 3, 3 ];
    const currentDirection = [ 0, 1, 0 ];
    const colorBasePlane = window.parent.window.getBasePlane( "COLOR_ORBITS" );

    const root = reify(
        "transform", {
            "scale": scaleUnit.join( ' ' )
        } );

    boxGroup
        .boxActions
        .filter( boxAction => boxAction.pair )
        .forEach( boxAction => {
            const [ leftCoord, rightCoord ] = boxAction.pair.location;
            const identity = arrayExactlyEquals( leftCoord, rightCoord );

            const selected = ( param.actionIndex == boxAction.id );

            const senderId =  "box-action-line." + boxAction.id;
            const clickAction = () => distributeMessages( 'xxxx', [ { 'indexKey': boxAction.id, 'sender': senderId } ] );

            const color = boxAction
                .pair
                .color
                .map( x => x.toString( 16 ).padStart( 2, '0' ) )
                .reduce( (a,c) => a + c, "#" );

            root
                .appendChild(
                    reify(
                        "group",
                        { "class": "box-action-line", "id": senderId },
                        [
                            identity
                                ? reify(
                                      "transform", { "translation": `${ leftCoord.join(' ') }` },
                                      [
                                        createSphereShape(
                                            `action-grid-point-${ leftCoord.join("-") }`,
                                            0.08,
                                            color,
                                            0,
                                            "",
                                            false
                                        ),
                                        reify(
                                            "transform", { "translation": "0.1 0 0" },
                                            [ createTextShape( boxAction.symbols[0], { "size": 0.12, "lit": true } ) ]
                                        )
                                      ]
                                  )
                                : createBoxAction( leftCoord, rightCoord, color, selected, boxAction.symbols[0], clickAction )
                        ]
                    )
                );
        } );

    return reify( "collision", { "enabled": false }, [ root ] );
}

function getOctahedralCellItems( boxGroup, selectedBoxAction ) {

    const [ p1, p2 ] = boxGroup.box.diagonal.map( p => to3D(p) );
    const maxBase = boxGroup.box.bases.reduce( (a,c) => c > a ? c : a, 0 );

    const scaleUnit = [ 3, 3, 3 ];
    const currentDirection = [ 0, 1, 0 ];
    const colorBasePlane = window.parent.window.getBasePlane( "COLOR_ORBITS" );

    const root = reify(
        "transform", {
            "scale": scaleUnit.join( ' ' )
        } );

    boxGroup.boxActions.forEach( boxAction => {
        const [ leftCoord, rightCoord ] = boxAction.pair.location;
        const identity = arrayExactlyEquals( leftCoord, rightCoord );

        const selected = ( selectedBoxAction == boxAction );

        const color = boxAction
            .pair
            .color
            .map( x => x.toString( 16 ).padStart( 2, '0' ) )
            .reduce( (a,c) => a + c, "#" );

        if ( !identity ) {
            root
                .appendChild(
                    reify(
                        "group",
                        { "class": "box-action-line", "id": ("box-action." + boxAction.id ) },
                        [ createBoxActionShape( leftCoord, rightCoord, color, selected, boxAction.symbols[0] ) ]
                    )
                );
        } else {
            root
                .appendChild(
                    reify(
                        "transform", { "translation": `${ leftCoord.join(' ') }` },
                        [ createSphereShape( `action-grid-point-${ leftCoord.join("-") }`, 0.1, color, 0 ) ]
                    ) );
        }
    } );

    return reify( "collision", { "enabled": false }, [ root ] );
}





function createCylinderSet( points, emissiveColor, attr = {} ){

    const {
        origin = [0,0,0],
        currentDirection = [0,1,0],
        scaleUnit = [1,1,1]
    } = attr;

    var cylinderSet = document.createElement( "group" );
    points
        .map( (a,i) => {
            const b = points[ (i + 1) % points.length ];

            // orient from a to b
            // move to midpoint a to b
            // insert cylinder shape

            const height = Math.sqrt( distance2( to3D( b.coord ), to3D( a.coord ) ) );
            const diff = subtraction( to3D( b.coord ), to3D( a.coord ) );
            const centre = addition( to3D( a.coord ), scale( diff, 0.5 ) );

            const unitNormal = normalize( diff );
            var rotationAxis = unitDisplacement( origin, crossProduct( currentDirection, unitNormal ) );
            var rotationAngle = Math.acos( dotProduct( currentDirection, unitNormal ) );

            const shape = createShape( emissiveColor, attr.linetype ? attr.linetype : "1", attr );
            shape.appendChild( reify( "cylinder", { "height": height, "radius": 0.01, "lit": false }, [] ) );

            return reify(
               "transform",
               { "translation": centre.join( ' ' ) },
               [
                   reify(
                       "transform",
                       { "rotation": rotationAxis.join( ' ' ) + ' ' + rotationAngle },
                       [ shape ]
               ) ]
           );
        } )
        .forEach( shape => cylinderSet.appendChild( shape ) );
    return cylinderSet;
}





function createDialLineSet( points, emissiveColor, attr = {} ){

    var shape = createShape( emissiveColor, "1", attr );
    var lineSet = document.createElement( "lineset" );
    shape.appendChild( lineSet );

    const theta = 2 * Math.PI / points.length;
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);

    const rotator = [
        [ 1, 0, 0 ],
        [ 0, cosTheta, -1 * sinTheta],
        [ 0, sinTheta, cosTheta ]
    ];

    function rotate( rotator, point ) {
        return [
            dotProduct( rotator[0], point ),
            dotProduct( rotator[1], point ),
            dotProduct( rotator[2], point )
        ];
    }

    var currentPoint = [ 0, 2, 2 ];
    var point = "";
    for ( var j = 0; j < points.length; j++ ) {
        point += `${ currentPoint.join( ' ' ) } `;
        currentPoint = rotate( rotator, currentPoint );
    }
    point += `${ currentPoint.join( ' ' ) } -1`;

    lineSet.setAttribute( 'vertexCount', `${ points.length + 1 }` );

    var coordinate = document.createElement( 'coordinate' );
    coordinate.setAttribute( 'point', `${ point }` );
    lineSet.append( coordinate );

    return shape;
}


function createCentreLine( p1, p2, pad = 0 ) {
    return createLineSetFromPoints( extendLine( p1, p2, pad ), "gray", 3 );
}


function insertX3DomFrame( containerId, selectedBoxAction, framePage ) {
    const viewerContainerId = containerId + "_plot";
    const viewerContainer = document.getElementById( viewerContainerId );
    if ( viewerContainer ) {
        var frameId = containerId + "_plot_frame";
        var iframeHtml = `<iframe id="${ frameId }" class="plot_frame" src="${ framePage }"></iframe>`;
        viewerContainer.innerHTML = iframeHtml;
    }
}



function openX3DomFrame( containerId, selectedBoxAction, framePage = 'orbitsViewer.html' ) {
    const windowFeatures = "menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes";

    window.open( `${ framePage }?id=${ selectedBoxAction.key }`, containerId, windowFeatures );
}
