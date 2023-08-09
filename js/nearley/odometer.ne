@{%
	// Moo lexer documention is here:
	// https://github.com/no-context/moo

	const moo = require("moo")
	const lexer = moo.compile({
        WS: /[ \t]+/,
        comment:    /\/\/.*?$|#.*?$/,
        number:     /-?[0-9]+/,
        string:     /"(?:\\["\\]|[^\n"\\])*"/,
        exp:        '^',
        star:       '*',
        colon:      ':',
        tilda:      '~',
        pipe:       '|',
        percent:    '%',
        comma:      ',',
        lparen:     '(',
        rparen:     ')',
        lsquare:    '[',
        rsquare:    ']',
        lcurly:     '{',
        rcurly:     '}',
        NL:    { match: /\n|;+/, lineBreaks: true },
	});

    const trimTree = ( a ) => {
		if ( a == null ) {
			return null;
		} else if ( Number.isInteger( a ) ) {
			return a;
		} else if ( Array.isArray( a ) ) {
			const candidate = a
				.map( b => trimTree( b ) )
				.filter( b => b != null )
				.filter( b => (!Array.isArray(b) || b.length > 0) );
			return Array.isArray(candidate) && candidate.length == 1
				? candidate[0]
				: candidate;
		} else if ( 'NL' == a.type ) {
			return null;
		} else if ( 'WS' == a.type ) {
			return null;
		} else if ( 'comment' == a.type ) {
			return null;
		} else if ( 'comma' == a.type ) {
			return null;
		} else if ( 'colon' == a.type ) {
			return null;
		} else if ( 'number' == a.type ) {
			return parseInt( a.text );
		} else {
			return a;
		}
	};
	const buildTuple = ( d ) => {
		const t = trimTree(d);
		if (Array.isArray(t) ) {
			return t.splice( 1, t.length - 2 );
		}
		return t;
	};
	const buildOp = ( d, op ) => {
		const t = trimTree(d);
		if (Array.isArray(t) && t.length == 3 ) {
			return { 'op': op, 'l': t[0], 'r': t[2] };
		}
		return t;
	};
	const buildBox = ( d ) => {
		const t = trimTree(d);
		if (Array.isArray(t) && t.length == 2 ) {
			if (Array.isArray(t[1])) {
				return { 'op': 'box', 'bases': [ t[0], ...t[1] ] };
			} else {
				return { 'op': 'box', 'bases': [ t[0], t[1] ] };

			}
		} else {
			return { 'op': 'box', 'bases': [ t ] };
		}
	};
	const buildIndex = ( d ) => {
		const t = trimTree(d);
		if ( Array.isArray( t ) ) {
			return { 'op': 'index', 'box': t[0], 'perms': t[1] };
//		} else if ( 'box' == t.op ) {
//			// TODO: lookup box and identify perms by decoding base presentation
//			const lPerm = t.bases.map((_,i) => i );
//			const rPerm = [...lPerm].reverse();
//			return { 'op': 'index', 'box': t, 'perms': [lPerm,rPerm] };
		} else {
			return { 'op': 'index', 'box': t };
		}
	};
%}

# Pass your lexer with @lexer:
@lexer lexer

main -> lines {% d => d[0] %}
lines -> line (%NL line):* {% d => {
	const t = trimTree(d);
	if (Array.isArray(t) && t.length == 2 && Array.isArray(t[1]) ) {
		return [t[0],...t[1]];
	}
	return t;
} %}
line -> content | %comment | %WS | null
content -> %WS:? expression %WS:? %comment:?
expression -> ( cycles | brackets )
operation -> ( twist | compose | power | product | product2 )

cycles -> ( index | compose | twist | power | product | product2 )
brackets -> %lparen %WS:? cycles %WS:? %rparen  {% d => {
	const t = trimTree(d)
	return t[1];
} %}

index -> box (%WS:? tuple %WS:? tuple):? {% buildIndex %}

box -> %number (%WS:? %colon %WS:? %number):* {% buildBox %}


power -> expression %WS:? %exp %WS:? %number {% d => buildOp( d, 'power' ) %}
compose -> expression %WS:? %star %WS:? expression {% d => buildOp( d, 'compose' ) %}
twist -> %number %WS:? %colon %colon %WS:? %number {% d => buildOp( d, 'twist' ) %}
product -> expression %WS:? %tilda %WS:? expression {% d => buildOp( d, 'product' ) %}
product2 -> expression %WS:? %pipe %WS:? expression {% d => buildOp( d, 'product2' ) %}

tuple -> %lsquare %WS:? %number (%WS:? %comma %WS:? %number):* %WS:? %rsquare {% buildTuple %}

