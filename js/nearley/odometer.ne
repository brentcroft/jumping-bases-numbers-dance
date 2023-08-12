@{%
	// Moo lexer documention is here:
	// https://github.com/no-context/moo

	const moo = require("moo")
	const lexer = moo.compile({
        WS: /[ \t]+/,
        comment:    /\/\/.*?$|#.*?$/,
        number:     /[0-9]+/,
        name:       /[a-zA-Z]+/,
        string:     /"(?:\\["\\]|[^\n"\\])*"/,
        equals:     '=',
        exp:        '^',
        star:       '*',
		slash:      '/',
		minus:      '-',
		plus:       '+',
        colon:      ':',
        tilda:      '~',
        pipe:       '|',
		period:     '.',
        percent:    '%',
		at:         '@',
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
		} else if ( 'number' == a.type ) {
			return parseInt( a.text );
		} else if ( [
				'NL', 'WS', 'comment',
				'comma', 'lsquare', 'rsquare', 'lparen', 'rparen', 'lcurly', 'rcurly',
				'exp', 'star', 'colon', 'tilda', 'pipe', 'percent', 'period', 'at', 'equals', 'slash',
				'minus', 'plus'
			].includes( a.type ) ) {
			return null;
		} else {
			return a;
		}
	};
	const buildOp = ( d, op ) => {
		const t = trimTree(d);
		if (Array.isArray(t) && t.length == 2 ) {
			return { 'op': op, 'l': t[0], 'r': t[1] };
		}
		return [ t ];
	};
	const buildFactuple = ( d, l, r ) => {
		var t = trimTree(d);
		if ( Array.isArray(t) ) {
			t = t.flatMap( c => Array.isArray( c ) ? c : [ c ] );
		} else {
		    t = [ t ];
		}
        const invalidIndexes = t.filter( (c,i) => c > i + 1 );
        if ( invalidIndexes.length > 0 ) {
            throw new Error( `Invalid factorial point [${ t }]: values: ${ invalidIndexes }` );
        }
		return t;
	};
	const buildPerm = ( d, l, r ) => {
		var t = trimTree(d);
		if ( Array.isArray(t) ) {
			t = t.flatMap( c => Array.isArray( c ) ? c : [ c ] );
			const missingIndexes = t.filter( (c,i) => t.indexOf(i) < 0 );
			if ( missingIndexes.length > 0 ) {
				throw new Error( `Invalid factorial perm [${ t }]: missing values: ${ missingIndexes }` );
			}
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
	const buildIndex = ( d, isFactIndex ) => {
		const t = trimTree(d);
		if ( Array.isArray( t ) ) {
		    const boxIndex = { 'op': 'index', 'box': t[0] };
		    const payload = Array.isArray(t[1][0]) ? t[1] : [t[1]];
		    if ( isFactIndex ) {
		        const requiredLength = boxIndex.box.bases.length - 1;
                const badFacts = payload.filter( p => p.length != requiredLength ).map( p => `{${ p }}`);
                if ( badFacts.length > 0 ) {
                    throw new Error( `Invalid factorial points for box [${ boxIndex.box.bases }]: require length ${ requiredLength }: ${ badFacts }` );
                }
		        boxIndex.facts = payload;
		    } else {
		        const requiredLength = boxIndex.box.bases.length;
                const badPerms = payload.filter( p => p.length != requiredLength ).map( p => `{${ p }}`);
                if ( badPerms.length > 0 ) {
                    throw new Error( `Invalid factorial perm for box [${ boxIndex.box.bases }]: require length ${ requiredLength }: ${ badPerms }` );
                }
		        boxIndex.perms = payload;
		    }
		    return boxIndex;
		} else {
			return { 'op': 'index', 'box': t };
		}
	};
	const buildMultiplicativeGroup = ( d, raw ) => {
		const t = trimTree(d);
		const spec = `${ t[0] } ${ raw ? '@' : '%' } ${ t[1] }`;
		const mg = {
			'op': 'mg',
			'key': spec,
			'coprime': t[0],
		};
		if (raw) {
			if (t[1] < 2) {
				throw new Error( `Invalid group spec: ${ spec } right side must be 2 or greater.` );
			}
			if (t[0] < 2) {
				throw new Error( `Invalid group spec: ${ spec } left side must be 2 or greater.` );
			}
			if (t[1] <= t[0]) {
				throw new Error( `Invalid group spec: ${ spec } left side must be less than right side.` );
			}
			const gcd = (a, b) => a ? gcd( b % a, a) : b;
			const divisor = gcd( t[1], t[0] );
			if ( divisor > 1 ) {
            	throw new Error( `Invalid group spec: ${ spec } (gcd = ${ divisor }) left side and right side must be coprime.` );
        	}
			mg.cofactor = (t[1] + 1) / t[0];
			mg.group = t[1];

		} else {
			mg.cofactor = t[1];
			mg.group =  (t[0] * t[1]) - 1;
		}
		return mg;
	};
	const buildNegation = ( d ) => {
		var t = trimTree(d);
		return -1 * t;
	};
	const buildProduct = ( d ) => {
		var t = trimTree(d);
		if ( Array.isArray(t) ) {
			t = t.flatMap( c => Array.isArray( c ) ? c : [ c ] );
		} else {
			t = [ t ];
		}
		return t.reduce( (a,c) => a * c, 1 );
	};
	const buildDivision = ( d ) => {
		var t = trimTree(d);
		if ( Array.isArray(t) ) {
			t = t.flatMap( c => Array.isArray( c ) ? c : [ c ] );
		} else {
			t = [ t ];
		}
		return t.slice(1).reduce( (a,c) => a / c, t[0] );
	};
	const buildAddition = ( d ) => {
		var t = trimTree(d);
		if ( Array.isArray(t) ) {
			t = t.flatMap( c => Array.isArray( c ) ? c : [ c ] );
		} else {
			t = [ t ];
		}
		return t.reduce( (a,c) => a + c, 0 );
	};
	const buildSubtraction = ( d ) => {
		var t = trimTree(d);
		if ( Array.isArray(t) ) {
			t = t.flatMap( c => Array.isArray( c ) ? c : [ c ] );
		} else {
			t = [ t ];
		}
		return t.slice(1).reduce( (a,c) => a - c, t[0] );
	};
	const buildExponentation = ( d ) => {
		var t = trimTree(d);
		return t[0] ** t[1];
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
line -> ( assignment | content | %comment | %WS | null )
assignment -> ( %WS:* (%name %WS:* %equals %WS:*):? expression %WS:* %comment:? ) {% trimTree %}
content -> ( %WS:* expression %WS:* %comment:? ) {% trimTree %}
expression -> ( cycles | brackets | %name ) {% trimTree %}

cycles -> ( factindex | index | mg | mgraw | extrude | compose | power )
brackets -> %lparen %WS:* expression %WS:* %rparen {% trimTree %}

extrude -> expression %WS:* %tilda %WS:* expression {% d => buildOp( d, 'product' ) %}
power -> expression %WS:* %exp %WS:* zinteger {% d => buildOp( d, 'power' ) %}
compose -> expression %WS:* %star %WS:* expression {% d => buildOp( d, 'compose' ) %}

index -> box (%WS:* perm (%WS:* perm):?):? {% d => buildIndex(d, false) %}
factindex -> box (%WS:* factuple (%WS:* factuple):?):? {% d => buildIndex(d, true) %}
box -> zinteger (%WS:* %colon %WS:* zinteger):* {% buildBox %}

factuple -> %lcurly %WS:* zinteger (%WS:* %comma %WS:* zinteger):* %WS:* %rcurly {% buildFactuple %}
perm -> %lsquare %WS:* zinteger (%WS:* %comma %WS:* zinteger):* %WS:* %rsquare {% buildPerm %}
mg -> zinteger %WS:* %percent %WS:* zinteger {% d => buildMultiplicativeGroup(d) %}
mgraw -> zinteger %WS:* %at %WS:* zinteger {% d => buildMultiplicativeGroup(d, true) %}

zinteger 		-> ( zbrackets | zpower | ninteger | pinteger ) {% trimTree %}
zbrackets 		-> %lparen %WS:* zinteger %WS:* %rparen {% trimTree %}
zpower 			-> ( pinteger | ninteger ) %WS:* %exp %WS:* zinteger {% buildExponentation %}
ninteger 		-> %minus pinteger {% buildNegation %}
pinteger 		-> %plus:? division {% trimTree %}
division 	    -> multiplication (%WS:* %slash %WS:* zinteger):* {% buildDivision %}
multiplication 	-> addition (%WS:* %period %WS:* zinteger):* {% buildProduct %}
addition 		-> subtraction (%WS:* %plus %WS:* zinteger):* {% buildAddition %}
subtraction 	-> %number (%WS:* %minus %WS:* zinteger):* {% buildSubtraction %}

