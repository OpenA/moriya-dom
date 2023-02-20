
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
		const suw_opts =  super(); suw_opts.className = 'suw-opts';
		const suw_area = _setup('div', { class: `suw-${editable ? 'input' : 'toggle'}`, 'data-empty': place_text, contentEditable: editable, spellcheck: false, autocomplete: 'off' });
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
		if (for_id)
			suw_area.id = suw_opts.htmlFor = for_id;
		if (editable) {
			this.__bindIteract(suw_area);
		} else if (marker) {
			suw_area.setAttribute('data-marker', marker);
		}
		suw_opts.addEventListener(MUIDragable.DOWN, this);
		suw_opts.append(suw_area, suw_list);

		Object.defineProperties(this, {
			options: { enumerable: true, value: options },
			selectedIndex: { enumerable: true,
				get: () => index, set: i => (this.value = options[i])
			},
			id: { enumerable: true,
				get: () => suw_area.id,
				set: m => (suw_area.id = suw_opts.htmlFor = m)
			},
			value: { enumerable: true,
				get: () => suw_area.innerText,
				set: s => (suw_area.textContent = (index = options.indexOf(s)) === -1 ? '' : s)
			}
		});
	}

	__bindIteract(input) {

		let complete  = [], ic = -1;
		const resetCompl = () => (
			input.removeAttribute('data-compl'), complete = [], ic = -1
		);
		const applyText = () => {
			resetCompl(), this.value = input.innerText.replace(/\n+/g, '');
			this.dispatchEvent(new InputEvent('change', { bubbles: true }));
		}
		input.addEventListener('blur', applyText);
		input.addEventListener('keydown', e => {
			switch(e.key) {
			case 'Enter': applyText(); break;
			case 'ArrowUp':
			case 'ArrowDown':
				var i = e.key.endsWith('Up') ? ic - 1 : ic + 1,
				    data = complete[i];
				if (data)
					input.setAttribute('data-compl', data), ic = i;
				break;
			case 'ArrowRight':
				var data = input.getAttribute('data-compl');
				if (data) {
					const r = window.getSelection().getRangeAt(0);
					input.removeAttribute('data-compl');
					input.textContent += data;
					r.setStartAfter(input.lastChild);
					r.setEndAfter(input.lastChild);
					break;
				}
			default: return;
			}
			e.preventDefault();
		});
		input.addEventListener('input', e => {
			let ustr = input.innerText.trim(),
			    hasc = resetCompl();
			if (!ustr) return;
			for(let opt of this.options) {
				if (opt.startsWith(ustr)) {
					let s = opt.substring(ustr.length); complete.push(s);
					if (hasc)
						hasc = ic = 0, input.setAttribute('data-compl', s);
				}
			}
		});
	}

	handleEvent(e) {
		switch (e.target.classList[0]) {
		case 'suw-item':
			this.value = e.target.getAttribute('data-value');
			this.dispatchEvent(new InputEvent('change', { bubbles: true }));
			this.classList.remove('suw-active');
			break;
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
