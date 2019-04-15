
window._APPLICATION_ = (() => {
	
	const param = {
		stroke_color: '#000000',
		stroke_size: 2,
		font_family: 'Impact',
		font_italic: 'normal',
		font_color: '#ffffff',
		font_bold: 'bold',
		font_size: 64
	};
	
	const tx = {};
	
	for (let name in param) {
		tx[name] = document.createTextNode( param[name] );
	}
	
	var loadChanges = (err, data) => {
		if (err)
			throw err;
	
		for (let name in data  ) {
			if ( name in param )
			  tx[name].textContent = (param[name] = data[name]);
		}
	}
	
	if (typeof require !== 'undefined') {
		let fs = require('fs');
		var saveChanges = () => {
			fs.writeFile('settings.json', param, (err) => {
				if (err)
					throw err;
			});
		}
		fs.readFile('settings.json', loadChanges);
		
	} else {
		loadChanges(false, JSON.parse(sessionStorage.getItem('saved_params')));
		var saveChanges = () => {
			sessionStorage.setItem('saved_params', JSON.stringify(param));
		}
	}
	
	document.head.appendChild(
		document.createElement('style')
	).append(`
		.macro-text {
			color: `       , tx.font_color  , `;
			font-family: "`, tx.font_family , `";
			font-weight: ` , tx.font_bold   , `;
			font-style: `  , tx.font_italic , `;
			font-size: `   , tx.font_size   , `px;
			-webkit-text-stroke: `, tx.stroke_size , `px `, tx.stroke_color ,`;
		}`
	);
	
	return {
		set stroke_color (hex)   { tx.stroke_color.textContent = (param.stroke_color = hex   ) },
		set stroke_size  (px)    { tx.stroke_size.textContent  = (param.stroke_size  = px    ) },
		set font_family  (name)  { tx.font_family.textContent  = (param.font_family  = name  ) },
		set font_italic  (apply) { tx.font_italic.textContent  = (param.font_italic  = apply ? 'italic' : 'normal') },
		set font_color   (hex)   { tx.font_color.textContent   = (param.font_color   = hex   ) },
		set font_bold    (apply) { tx.font_bold.textContent    = (param.font_bold    = apply ? 'bold'   : 'normal') },
		set font_size    (px)    { tx.font_size.textContent    = (param.font_size    = px    ) },
		
		get stroke_color () { return param.stroke_color },
		get stroke_size  () { return param.stroke_size  },
		get font_family  () { return param.font_family  },
		get font_italic  () { return param.font_italic  },
		get font_color   () { return param.font_color   },
		get font_bold    () { return param.font_bold    },
		get font_size    () { return param.font_size    },
		
		store() {
			saveChanges();
		}
	}
})();
