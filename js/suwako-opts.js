
class SuwakoInput extends HTMLDivElement {

	constructor({
		place_text = 'Empty',
		on_apply_emiter = false,
		list = []
	}) {
		const suw_inp = super();

		suw_inp.className = 'suw-input';
		suw_inp.contentEditable = true;
		suw_inp.spellcheck = false;
		suw_inp.setAttribute('autocomplete', 'off');
		suw_inp.setAttribute('data-empty', place_text);
		suw_inp.addEventListener('input', this);
		suw_inp.addEventListener('keydown', this);
		if (on_apply_emiter) {
			suw_inp.addEventListener('keyup', this);
			suw_inp.addEventListener('blur', this);
		}
		Object.defineProperties(this, {
			variants : { enumerable: true, value: list },
			compIndex: { enumerable: true, value: -1, writable: true }
		});
	}
	onApplyChange() {}

	get textContent() { return super.textContent  }
	set textContent(str) {
		this.removeAttribute('data-compl');
		super.textContent = str;
	}

	checkCompl(sp = '', idx = 0, fill = false) {
		let p = this.variants[idx],
		   ep = this.getAttribute('data-compl');
		if (p && p.startsWith(sp) && p.endsWith(ep)) {
			if (fill) {
				this.textContent = sp + ep;
			} else
				this.setAttribute('data-compl', p.substring(sp.length));
			return sp.length + ep.length;
		}
		return 0;
	}
	findCompl(sp = '', i = 0, re = false) {
		const { variants } = this;
		for (let p; i >= 0 && i < variants.length; re ? i-- : i++) {
			if ((p = variants[i]).startsWith(sp)) {
				this.setAttribute('data-compl', p.substring(sp.length));
				this.compIndex = i;
				return true;
			}
		}
		return false;
	}
	resetCompl(clear = false) {
		this.removeAttribute('data-compl');
		this.compIndex = -1;
		if (clear) super.textContent = '';
	}

	handleEvent(e) {
		let sp = this.innerText, re = false,
			i  = this.compIndex, o  = 1;
		switch (e.type) {
		case 'keyup':
			if (e.key !== 'Enter')
				break;
		case 'blur':
			this.onApplyChange();
			break;
		case 'input':
			if (!sp || !(this.checkCompl(sp, i) || this.findCompl(sp)))
				this.resetCompl(!sp);
			break;
		case 'keydown':
			switch (e.key) {
			case 'ArrowRight':
				if (sp && (o = this.checkCompl(sp, i, true))) {
					const r = window.getSelection().getRangeAt(0);
					r.setStart(this.firstChild, o - 1);
					r.setEnd  (this.firstChild, o);
				}
				break;
			case 'ArrowUp': o = -1, re = true;
			case 'ArrowDown':
				if (sp && this.findCompl(sp, i + o, re))
					;
			case 'Enter':
				e.preventDefault();
				break;
			}
		}
	}
};

/** Custom element like `<select>[...<option>]</select>` */
class SuwakoOptions extends HTMLLabelElement {

	constructor({
		for_id = '',
		marker = '▼',
		place_text = 'None',
		type = 1,
		list = []
	}) {
		const editable = type === 2;
		const dummybtn = type === 0;
		const suw_opts =  super();
		const suw_list = _setup('ul', { class: 'suw-list', style: 'position: absolute; z-index: 1;' });

		let options = [], index = -1;

		for (let attrs of list) {
			let { 'data-value': val, 'class': cl } = attrs;
			if ( !val ) {
				attrs.class = 'suw-hr'+ (cl ? ' '+ cl : '');
				suw_list.append(_setup('div', attrs))
			} else if (!options.includes(val)) {
				options.push(val);
				attrs.class = 'suw-item'+ (cl ? ' '+ cl : '');
				suw_list.append(_setup('li', attrs));
			}
		}
		const suw_area = (
			editable ? new SuwakoInput({ place_text, list: options, on_apply_emiter: true }) :
			dummybtn ? document.createTextNode(marker) :
			_setup('div', { class: 'suw-toggle', 'data-marker': marker, 'data-empty': place_text })
		);
		if (editable) {
			suw_area.onApplyChange = () => {
				index = suw_area.compIndex;
				this.dispatchEvent(new InputEvent('change', { bubbles: true }));
			}
		}
		suw_area.id = suw_opts.htmlFor = for_id;
		suw_opts.className = `suw${dummybtn ? '-toggle':''}-opts`;
		suw_opts.addEventListener(MUIDragable.DOWN, this);
		suw_opts.append(suw_area, suw_list);

		Object.defineProperties(this, {
			options: { enumerable: true, value: options },
			selectedIndex: { enumerable: true,
				get: () => index,
				set: i => {suw_area.compIndex = (index = i);}
			},
			id: { enumerable: true,
				get: () => for_id,
				set: m => {suw_area.id = suw_opts.htmlFor = (for_id = m)}
			},
			value: dummybtn ? { enumerable: true, writable: true, value: '' } : { enumerable: true,
				get: () => suw_area.innerText,
				set: s => {suw_area.textContent = s;}
			}
		});
	}

	handleEvent(e) {
		switch (e.target.classList[0]) {
		case 'suw-item':
			let val = e.target.getAttribute('data-value');
			this.selectedIndex = this.options.indexOf(val);
			this.value = val;
			this.dispatchEvent(new InputEvent('change', { bubbles: true }));
			this.classList.remove('suw-active');
			break;
		case 'suw-toggle-opts':
		case 'suw-toggle':
			this.classList.toggle('suw-active');
		case 'suw-hr':
			break;
		default:
			return;
		}
		e.preventDefault();
		e.stopPropagation();
	}
};
customElements.define('suw-opts', SuwakoOptions, { extends: 'label' });
customElements.define('suw-input', SuwakoInput, { extends: 'div' });
