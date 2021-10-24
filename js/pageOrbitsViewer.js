
function getParam() {

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    const basesParam = urlParams.get('bases');

    const toggles = { ...toggleKeys };

    const toggleParam = urlParams.get('toggles');
    if ( toggleParam ) {
        Object
            .keys( toggles )
            .forEach( k => toggles[k] = 0 );
        toggleParam
            .split(',')
            .forEach( x => toggles[x] = 1 );
    }

    return {
        id: urlParams.get('id'),
        bases: basesParam.split(",").map(x=> Number(x)),
        orbits: urlParams.get('orbits'),
        toggles: toggles
    };
}

function clearSelected() {
    document
        .querySelectorAll( ".selected" )
        .forEach( item => item.classList.remove('selected') );
}
function toggleLines( containerId ) {
    toggleBySelector( containerId, ".orbit-line"  );
}
function toggleLocus( containerId ) {
    toggleBySelector( containerId, ".orbit-system-locus"  );
}
function toggleGrid( containerId ) {
    toggleBySelector( containerId, ".grid-coords" );
}
function toggleCentres( containerId ) {
    toggleBySelector( containerId, ".orbit-centre" );
}
function togglePlane( containerId ) {
    toggleBySelector( containerId, ".orbit-plane" );
}


function toggleBySelector( containerId, cssSelector, translator = (x) => x ) {
    const selectedElements = document
        .getElementById( containerId )
        .querySelectorAll( cssSelector );

    selectedElements.forEach( selectedElement => {
            const element = ( translator )
                ? translator( selectedElement )
                : selectedElement;
            const render = ("false" == element.getAttribute( "render" ) );
            element.setAttribute( "render", render );
        });
}


function showLocus( containerId, basePlane, locusPoints, multi ) {
    const locusGroup = document
        .getElementById( containerId )
        .querySelector( "group.orbit-system-locus" );

    while ( locusGroup.firstChild ) {
        locusGroup.removeChild( locusGroup.lastChild );
    }

    locusGroup.appendChild( createLineSet( basePlane.getLocusPoints( locusPoints ) ) );
}





function showOrbit( containerId, basePlane, senderId, multi ) {
    const [ tableId, ...orbitIds ] = senderId.split( "." );
    const orbits = document
        .getElementById( containerId )
        .querySelectorAll( ".orbit-line" );

    orbits.forEach( orbitElement => {
            const [ cId, oId ] = orbitElement.id.split( "." );
            if ( !orbitIds.includes( oId ) ) {
                if ( multi && orbitElement.classList.contains( "selected" ) ) {
                } else {
                    orbitElement.setAttribute( "render", false );
                    orbitElement.classList.remove("selected");
                }
            } else if ( orbitElement.classList.contains( "selected" ) ) {
                orbitElement.setAttribute( "render", false );
                orbitElement.classList.remove("selected");
            } else {
                orbitElement.setAttribute( "render", true );
                orbitElement.classList.add("selected");
            }
        });
}

function showAllOrbits( containerId, basePlane ) {
    const orbits = document
        .getElementById( containerId )
        .querySelectorAll( ".orbit-line" )
        .forEach( orbitElement => {
            orbitElement.setAttribute( "render", true );
            orbitElement.classList.remove("selected");
        });
}


function getBasePlaneItems( basePlane, toggles ) {

    const orbits = basePlane.orbits;
    const fixedPointTransparency = 0.2;
    const colorBasePlane = window.parent.window.getBasePlane( "COLOR_ORBITS" );

    const [ p1, p2 ] = basePlane.box.diagonal;
    const maxBase = basePlane.box.bases.reduce( (a,c) => c > a ? c : a, 0 );

    const scaleUnit = toggles.scale3d ? scale( unitDisplacement( p1, p2 ), 2 ) : [ .8, .8, .8 ];

    // move origin to system centre and scale by scaleUnit
    const root = reify(
        "transform", {
            "translation": scale( basePlane.box.centre, -1 ).join( ' ' ),
            "scale": scaleUnit.map( x => x==0 ? 1 : 1/x ).join( ' ' )
        } );


    function appendGridChildren( grid ) {
        const [ b0, b1, b2 ] = basePlane.box.bases;
        const gridCoordStyle = { "family": "'San Serif'", "size": 0.05 };
        const gridPointRadius = 0.05;

        for ( var i = 0; i < b0; i++ ) {
            for ( var j = 0; j < b1; j++ ) {
                for ( var k = 0; k < b2; k++ ) {
                    grid
                        .appendChild(
                            reify(
                                "Transform",
                                {
                                    "translation": [ i, j, k ].join( ' ' ),
                                    "scale": scaleUnit.join( ' ' )
                                },
                                [
                                    createSphereShape( `grid-point-${ [ i, j, k ].join( '.' ) }`, gridPointRadius, 'black', 0.10, `(${ [ i, j, k ].join( ',' ) })` ),
                                    createTextShape( `(${ [ i, j, k ].join( ',' ) })`, gridCoordStyle )
                                ]
                            )
                        );
                }
            }
        }
    }

    // GRID
    root
        .appendChild(
            reify(
                "Collision",
                {
                    "class": "grid-coords",
                    "enabled": false,
                    "render": toggles.grid == 1
                },
                [],
                [ appendGridChildren ]
            )
        );




    // PLANE
    var currentDirection = [0,1,0];
    currentDirection[ 1 ] = 1;
    var planeColor = "black";
    var planeTransparency = 0.95;

    var planeItem = createPlaneItemWithNormal( {
            centre: basePlane.box.centre,
            planeNormal: basePlane.identityPlaneNormal,
            scaleUnit: [1,1,1],
            currentDirection: [0,1,0],
            origin: [0,0,0],
            size: [ basePlane.box.bases[0], 0, basePlane.box.bases[basePlane.box.bases.length-1] ],
            planeColor: planeColor,
            planeTransparency: planeTransparency
        } );

    planeItem.setAttribute( "render", toggles.plane == 1 );



    // CENTRE LINES
    const centrePoints = basePlane
        .centrePoints
        .map( x => reify(
                        "transform",
                        {
                            "translation": x.point.join( ' ' ),
                            "scale": scaleUnit.join( ' ' )
                        },
                        [ createSphereShape( null, 0.1, "yellow", 0 ) ]
                    ) );



    const centreLines = basePlane
        .centreLines
        .map( centreLine => createLineSetFromPoints( extendLine( centreLine.points[0], centreLine.points[1], maxBase / 2 ), "gray", "3" ) );

    const centreItems = reify(
        "group",
        { "class": "orbit-centre", "render": toggles.centres == 1 },
        centrePoints.concat( centreLines )
    );

    root.appendChild( planeItem );
    root.appendChild( centreItems );

    // FIXED POINTS
    basePlane
        .identities
        .forEach(
            orbit => orbit
                .coords
                .map( point => {
                    return {
                            "pointId": "point-" + point.coord.join( '.' ),
                            "translation": point.coord.join( ' ' ),
                            "scale": scaleUnit.join( ' ' ),
                            "report": point.report(),
                            "json": point.getJson()
                        };
                    }
                )
        .forEach( identityPoint => root
            .appendChild(
                reify(
                    "Transform",
                    identityPoint,
                    [ createSphereShape( identityPoint.pointId, 0.1, "red", fixedPointTransparency, JSON.stringify( identityPoint.json ) ) ] )
                )
            )
        );


    // ORBITS
    for ( var i = 0; i < orbits.length; i++ ) {
        const orbit = orbits[i];
        const orbitColor = colorBasePlane.colorForIndex( orbit.index );
        root
            .appendChild(
                reify(
                    "group",
                    { "class": "orbit-line", "id": ("orbit." + orbit.index ) },
                    [
                        createLineSet( orbit.coords, orbitColor ),
                        reify(
                            "transform",
                            {
                                "translation": orbit.centre.join( ' ' ),
                                "scale": scaleUnit.join( ' ' )
                            },
                            [ createSphereShape( "orbit." + orbit.index + ".0" , 0.09, "gray" ) ]
                        ),
                        ...orbit.coords.map( (x,i) => reify(
                            "transform",
                            {
                                "translation": x.coord.join( ' ' ),
                                "scale": scaleUnit.join( ' ' ),
                                "class": "orbitCoord",
                                "id": `orbitCoord.${ x.index }.${ i }`
                            },
                            [ createSphereShape( "orbit." + orbit.index + "." + i, 0.07, orbitColor, 0, JSON.stringify( x.getJson() ) ) ] ) )
                    ],
                    [ ( e ) => e.setAttribute( "render", toggles.lines == 1 ) ]
                )
            );
    }

    try {
        root
            .appendChild(
                reify(
                    "Group",
                    {
                        "class": "orbit-system-locus",
                        "render": toggles.locus == 1
                    },
                    [
                        createLineSet( basePlane.getLocusPoints( basePlane.locusPoints ) )
                    ]
                )
            );
    } catch ( e ) {
        console.log( "Bad locus points: " + e );
    }

    return reify( "collision", { "enabled": false }, [ root ] );
}



function setSelectedPoints( containerId, selectedPoints, basePlane ) {
    const existingSelectedPoints = document
        .getElementById( containerId )
        .querySelectorAll( "sphere.selected" );

    const standardRadius = 0.3;
    const selectedRadius = 0.5;

    existingSelectedPoints
        .forEach( sphereElement => {
            sphereElement.setAttribute( "radius", standardRadius );
            sphereElement.classList.remove("selected");
            console.log( `de-selected point: ${ sphereElement.id }` );
        });

    selectedPoints
        .forEach( p => {
            const idSuffix = p.coord.join("-");
            const sphereElement = document.querySelector( `sphere#point-${ idSuffix }` );

            if ( sphereElement && sphereElement.tagName == "SPHERE" ) {
                sphereElement.setAttribute( "radius", selectedRadius );
                sphereElement.classList.add("selected")
                //console.log( `selected point: ${ JSON.stringify( p ) }` );
            } else {
                console.log( `selected point not found: ${ JSON.stringify( p ) }` );
            }
        } );

    const selectedPointsInfo = selectedPoints
        .map( ( point, i ) => ( i + 1 ) + ": " + JSON.stringify( point.coord ) + " " + JSON.stringify( point.indexes[basePlane.id] ) )
        .join( "\n" );

    document
        .getElementById("selectedPointsInfo")
        .innerHTML = "<pre>" + selectedPointsInfo + "</pre>";
}


function getBasePlaneCycles( basePlane, toggles ) {

    const indexId = basePlane.id;
    const orbits = basePlane.orbits;
    const fixedPointTransparency = 0.1;
    const colorBasePlane = window.parent.window.getBasePlane( "COLOR_ORBITS" );
    const indexCentre = basePlane.box.indexCentre;

    const zOff = 1;
    const scaleUnit = scale( [ 1, 1, 1 ], 10 / basePlane.box.volume );

    const root = reify( "transform", { "translation": `${ -1 * basePlane.box.volume / 2 } 0 0` } );

    // IDENTITIES GRID
    const attr = { "linetype": "0" };

    root
        .appendChild(
            reify(
                "collision",
                {
                    "class": "grid-coords",
                    "enabled": false,
                    "render": toggles.grid == 1
                },
                [
                    ...basePlane
                        .identities
                        .map( identity => reify(
                                "transform",
                                {
                                    "translation": `${ identity.coords[0].indexes[indexId].id } 0 ${ zOff * -1 }`
                                },
                                [
                                    //createSphereShape( `grid-point-${ identity.coords[0].coord.join( '-' ) }`, 0.2, "red", 0.3, JSON.stringify( identity.coords[0].getJson() ) ),
                                    createLineSet( [ new Point( -1, [ 0, 0, 0 ] ), new Point( -1, [ 0, 0, zOff * ( orbits.length ) ] ) ], "black", attr )
                                ]
                            )
                        ),

                    createLineSet(
                                [ new Point( -1, [ 0, 0, zOff * ( -1 ) ] ), new Point( -1, [ basePlane.box.volume - 1, 0, zOff * ( -1 ) ] ) ],
                                "black",
                                attr
                            ),

                    ...basePlane
                        .orbits
                        .map( ( orbit, i ) => createLineSet(
                                [ new Point( -1, [ 0, 0, zOff * ( i ) ] ), new Point( -1, [ basePlane.box.volume - 1, 0, zOff * ( i ) ] ) ],
                                colorBasePlane.colorForIndex( orbit.index ),
                                attr
                            )
                        )
                ]
            )
        );

    // PLANE
    var currentDirection = [0,1,0];
    var planeColor = "black";
    var planeTransparency = 0.5;

    var planeItem = createPlaneItem(
            [ indexCentre, 0, zOff * (orbits.length - 2) / 2 ],
            [ 1, 0, 0 ],
            scale( [ 0.001, -1 * zOff, 1 + orbits.length ], 1 ),
            currentDirection,
            [ 0, 0, 0 ],
            [ 1, 1, 1 ],
            planeColor,
            planeTransparency);

    planeItem.setAttribute( "render", toggles.plane == 1 );

    root
        .appendChild( planeItem );


    // ORBITS
    basePlane
        .identities
        .map( identityOrbit => identityOrbit.coords[0] )
        .map( identityPoint => {
            return {
                ...identityPoint.indexes[ indexId ],
                "report": identityPoint.report(),
                "json": identityPoint.getJson(),
                coord: identityPoint.coord
            };
        })
        .map( identity => reify(
                "transform",
                {
                    "translation": `${ identity.id } 0 ${ -1 * zOff }`,
                    "id": `identity.e.${ identity.id }`
                },
                [
                    createSphereShape( `point-${ identity.coord.join("-") }`, 0.17, "red", 0.3, JSON.stringify( identity.json ) ),
                    reify(
                        "transform",
                        {
                            "rotation": `0 1 0 ${ PI / 2 }`
                        },
                        [
                            createTorusShape( {
                                outerRadius: ( identity.jump / 2),
                                size: 0.05,
                                emissiveColor: "yellow",
                                transparency: 0,
                                angle: 2 * PI,
                                cssClass: "identity-line",
                                toggles: toggles
                             } )
                        ] )
                ]
            )
        )
        .forEach( x => root.appendChild(x) );

    for ( var i = 0; i < orbits.length; i++ ) {
        const orbit = orbits[i];
        const color = colorBasePlane.colorForIndex( orbit.index );
        if (orbit.coords.length > 1 ) {
            root
                .appendChild(
                    reify(
                        "transform",
                        {
                            "translation": `0 0 ${ zOff * i }`,
                            "class": "orbit-line",
                            "id": ("orbit." + orbit.index )
                        },
                        [
                            ...orbit
                                .coords
                                .map( ( entry, i ) => {
                                        const point = entry.indexes[ indexId ];
                                        const pointParity = point.jump < 0 ? -1 : 1;
                                        return reify(
                                            "transform", { "translation": `${ point.id } 0 0` },
                                            [
                                                //createConeShape( `point-${ entry.coord.join("-") }`, pointParity * 1.17, "red", 0.5, JSON.stringify( entry.getJson() ) ),
                                                createSphereShape( `point-${ entry.coord.join("-") }`, 0.3, color, 0, JSON.stringify( entry.getJson() ) ),
                                                reify(
                                                    "transform", { "translation": `${ point.jump / 2 } 0 0` },
                                                    [
                                                        createTorusShape( {
                                                                outerRadius: ( point.jump / 2),
                                                                size: 0.1,
                                                                emissiveColor: color,
                                                                transparency: 0,
                                                                angle: PI,
                                                                cssClass: "orbitation",
                                                                toggles: toggles
                                                             } )
                                                    ] )
                                            ]
                                        );
                                    }
                                )
                        ]
                    )
                );
        }
    }

    return reify(
        "collision",
        { "enabled": false },
        [ reify( "transform", { "scale": `${ scaleUnit.join( ' ' ) }` }, [ root ] ) ]
    );
}



function plotData( duration ) {
    const param = getParam();
    const basePlane = window.parent.window.getBasePlane( param.id );
}


function plotBasePlane( basePlane, param ) {

    var x3domContainerId =  'testContainer001_plot';
    const sceneRootId = `${ x3domContainerId }_scene_root`;
    const sceneRoot = document.getElementById( sceneRootId );

    var osi = (param.toggles.grid3d == 1 && basePlane.box.rank == 3 )
        ? getBasePlaneItems( basePlane, param.toggles )
        : getBasePlaneCycles( basePlane, param.toggles );

    sceneRoot.appendChild( osi );

    var x3dRuntime = document.getElementById( x3domContainerId );
    //x3dRuntime.runtime.showAll( "negZ");
    x3dRuntime.runtime.resetView();

    //console.log( "Created X3DOM container: " + x3domContainerId );
}



function distributeMessage( message = {} ) {
    window.postMessage( message, "*" );
    window.parent.window.postMessage( message, "*" );
}

function distributeMessages( messages = [] ) {
    messages.forEach( message => distributeMessage( message) );
}




function initPage() {

    const param = getParam();
    basePlane = window.parent.window.getBasePlane( param.id );

    plotBasePlane( basePlane, param );

    const spheres = [ ...document
        .querySelectorAll( "sphere" ) ];
    const shapes = spheres
        .map( s => s.parentNode );
    const tooltipped = shapes
        .filter( s => s.getAttribute( "tooltip" ) );

    tooltipped
        .forEach( s => {
                s.onclick = function( event ) {
                    const tooltipData = s.getAttribute( "tooltip" );
                    const point = JSON.parse( tooltipData );

                    console.log( `selected point: [${ point.coord.join(", ") }], raw: ${ point.id }, ${basePlane.id}=${ JSON.stringify( point.indexes[ basePlane.id ] ) }` );

                    distributeMessage( {
                        basis: "point",
                        json: point
                    } );
                };
        });


    window.addEventListener( "message", ( event ) => {
        if ( event.data ) {
            var data = event.data;

            //console.log( `data: ${ JSON.stringify( data ) }` );

            if ( data.basis ) {

                if ( "selected-points" == data.basis ) {
                    setSelectedPoints( "testContainer001", data.points, basePlane );
                }

            } else if ( data.basePlaneKey ) {
                const basePlane = window.parent.window.getBasePlane( data.basePlaneKey );
                if ( data.sender ) {
                    showOrbit( "testContainer001", basePlane, data.sender, data.multi );
                } else if ( data.locus ) {
                    showLocus( "testContainer001", basePlane, data.locus, data.multi );
                } else {
                    showAllOrbits( "testContainer001", basePlane );
                }
            } else if ( data.toggleGrid ) {
                toggleGrid( "testContainer001" );
            } else if ( data.toggleCentres ) {
                toggleCentres( "testContainer001" );
            } else if ( data.togglePlane ) {
                togglePlane( "testContainer001" );
            } else if ( data.toggleLines ) {
                toggleLines( "testContainer001" );
            } else if ( data.toggleLocus ) {
                toggleLocus( "testContainer001" );
            } else if ( data.clearSelected ) {
                clearSelected();
            }
        }
    });
}