/**
 * **Kanako Input** - is a formated TextInput from [moriya-dom](https://github.com/OpenA/moriya-dom) collection
 *                   (work overing standart textarea input).
 * 
 * project inspired by monaco-editor (VS Code), but not uses his code
 * and focused on markdown / bbcode editing style.
 * 
 * *possible settings for pass*
 * 
 * * `placeholder` - message displayed in empty area (can bee change later)
 * * `txtarea` - you own textarea backend (from posting form for example)
 *
 */
class KanakoInput extends HTMLElement {
/**
 * @param {Object} [settings] initial element settings
 * @param {String} [settings.placeholder] message displayed in empty area
 * @param {HTMLTextAreaElement} [settings.txtarea] custom textarea backend
 */
	constructor(settings = {}) {

		let {
			placeholder = 'Message Text',
			txtarea
		} = settings;

		const ka_nako   = _setup(super(/**/), { style: 'position: relative; user-select: none; width: 330px; height: 160px;', class: 'ka-nako' });
		const ka_resize = _setup('ka-resize', { style: 'position: absolute; bottom: 0; right: 0;' });
		const ka_scroll = _setup('ka-scroll', { style: 'position: absolute; left: 0; top: 0; width: 100%; height: 100%;' });
		const ka_naitxt = _setup('ka-naitxt', { style: 'position: absolute; left: 0; top: 0; width: 100%; height: 100%;' });
		const ka_scur   = _setup('ka-cursor', { style: 'position: absolute; left: 0; top: 0;', class: 'ka-scur' });
		const ka_ecur   = _setup('ka-cursor', { style: 'position: absolute; left: 0; top: 0;', class: 'ka-ecur' });

		const kasen_coll = ka_naitxt.getElementsByTagName('ka-sen');
		const ka_txtarea = txtarea instanceof HTMLTextAreaElement ? txtarea : ka_nako.appendChild(
			_setup('textarea', { class: 'ka-txtarea', style: 'position: absolute; left: 0; top: 0; width: 0; height: 0; margin: 0; outline: none; resize: none; border: none; cursor: text;' })
		);
		ka_nako.append( ka_scroll, ka_resize );
		ka_scroll.append( ka_naitxt, ka_scur, ka_ecur );

		const anim = new MoriyaAnimation;
		let ka_pa  = _setup('ka-pa' , { name: 'ka_parent' }),
		    ka_sen = _setup('ka-sen', { name: 'ka_pasen', 'kana-text': placeholder }),
		    tx_ctx = null;

		anim.onIteration = () => ka_scur.classList.toggle('wink-ko');
		ka_naitxt.appendChild(ka_pa).appendChild(ka_sen).append('');
		ka_txtarea.addEventListener('input', this);
		ka_txtarea.addEventListener('blur', () => {
			anim.reset(false), ka_scur.classList.remove('wink-ko');
		});
		ka_nako.addEventListener(MUIDragable.DOWN, e => {
			const el = e.target,
			   point = MUIDragable.getPoint(e);
			if (el === ka_txtarea || el === ka_scur || !point)
				return;
			if (el === ka_resize) {
				point.action = 'resize';
				point.minW = point.minH = 50;
			} else {
				anim.reset(true), ka_scur.classList.add('wink-ko');
				this.setCarretPos(e.rangeParent, e.rangeOffset);
				const { startContainer: sCont, startOffset: sPos } = this.kaRgo;
				point.onAction = ({ pointX, pointY, left, top, width, height }, e) => {
					const maxX = width + left,
					      maxY = height + top;
					if (pointX > left && pointX < maxX && pointY > top && pointY < maxY)
						this.setSelectionRange(sCont, sPos, e.rangeParent, e.rangeOffset);
				}
			}
			e.stopPropagation();
			e.preventDefault();
			MUIDragable.live(ka_nako, point);
		});

		const getContext = (el, type = XPathResult.ORDERED_NODE_SNAPSHOT_TYPE) => {
			if(!tx_ctx)
				tx_ctx = new XPathEvaluator().createExpression('.//text()');
			return tx_ctx.evaluate(el, type);
		}
		Object.defineProperties(this, {
			kaTextArea : { value: ka_txtarea },
			kaContainer: { value: ka_naitxt  },
			kaTxtCursor: { value: ka_scur    },
			getContext : { value: getContext },
			placeholder: {
				set: msg => kasen_coll[0].setAttribute('kana-text', (placeholder = msg)),
				get: () => placeholder
			},
			kaPaList : { get: () => Array.from(ka_naitxt.children) },
			kaSenList: { get: () => Array.from(kasen_coll) },

			kaRgo: { get: () => Object.defineProperty(this, 'kaRgo', { value: new Range }).kaRgo, configurable: true },
			kaPa : { get: () => ka_naitxt.children.ka_parent },
			kaSen: { get: () => kasen_coll.ka_pasen }
		});
		if (true)
			ka_txtarea.style.left = ka_txtarea.style.width = ka_txtarea.style.height = '100%';
	}

	insertText(txt = '') {

		let cont = this.kaRgo.startContainer,
		     pos = this.kaRgo.startOffset;

		cont.insertData(pos, txt);
		pos += txt.length;

		this.kaRgo.setStart(cont, pos);
		this.kaRgo.setEnd(cont, pos);
	}

	setCarretPos(cont, pos) {

		const { kaSenList, kaTextArea, kaRgo, kaSen, kaPa } = this;

		let ukapa = null, ukasen = null, isTxt = cont.nodeName === '#text';

		for (let i = 0, f = true; i < kaSenList.length; i++) {
			const kasen = kaSenList[i], kapa = kasen.parentNode;
			kasen.style.backgroundImage = null;
			if (f && (isTxt ? kasen.contains(cont) : cont === kasen || cont === kapa))
				f = false, ukasen = kasen, ukapa = kapa;
		}
		if (!ukasen)
			return;
		if (kaSen !== ukasen)
			kaSen.removeAttribute('name'), ukasen.setAttribute('name', 'ka_pasen');
		if (kaPa !== ukapa)
			kaPa.removeAttribute('name'), ukapa.setAttribute('name', 'ka_parent');
		if (!isTxt) {
			let res = this.getContext(cont);
			cont = res.snapshotItem(pos === 1 ? res.snapshotLength - 1 : 0),
			pos  = pos === 1 ? cont.length : 0;
		}
		kaTextArea.focus();
		kaRgo.setStart(cont, pos);
		kaRgo.setEnd(cont, pos);
		this.updateCursor();
	}

	setSelectionRange(sCont, sPos, eCont, ePos) {

		const { kaSenList, kaTextArea, kaRgo } = this;

		let inLine = eCont === sCont, isTxt = sCont.nodeName === '#text',
		    isReverse = inLine && sPos > ePos, six = -1, eix = -1;

		for (let i = 0; i < kaSenList.length; i++) {
			const kasen = kaSenList[i], kapa = kasen.parentNode;
			if (six === -1 && kasen.contains(sCont))
				six = i;
			if (eix === -1 && (isTxt && kasen.contains(eCont) || eCont === kasen || eCont === kapa))
				eix = i;
			kasen.style.backgroundImage = null;
		}
		if (inLine && sPos === ePos || eix === -1)
			return;
		if (!inLine) {
			let xRes = this.getContext(kaSenList[eix]);
			if (!isTxt) {
				cont = xRes.snapshotItem(ePos === 1 ? xRes.snapshotLength - 1 : 0),
				pos  = ePos === 1 ? eCont.length : 0;
			}
			if ((inLine = eix === six)) {
				let s = -1, e = -1;
				for (let i = 0; i < xRes.snapshotLength; i++) {
					const item = xRes.snapshotItem(i);
					if (item === sCont) s = i; else
					if (item === eCont) e = i;
				}
				isReverse = e < s;
			} else {
				isReverse = eix < six;
			}
		}
		if (isReverse) {
			let cont = sCont, pos = sPos, idx = six;
			sCont = eCont, sPos = ePos, six = eix;
			eCont = cont,  ePos = pos, eix = idx;
		}
		kaRgo.setStart(sCont, sPos);
		kaRgo.setEnd(eCont, ePos);

		const recs = kaRgo.getClientRects(),
		     eLeft = kaSenList[six].getBoundingClientRect().left,
		       len = recs.length;

		if (inLine && len) {
			let x = recs[0].x - eLeft, w = x;
			for (let i = 0; i < len; i++)
				w += recs[i].width;
			kaSenList[eix].style.backgroundImage = `linear-gradient(90deg, transparent ${
				x}px, var(--ka-selectColor) ${x}px, var(--ka-selectColor) ${w}px, transparent ${w
			}px)`;
		} else if (len) {
			const x = recs[0].x - eLeft,
			      w = recs[len - 1].x - eLeft + recs[len - 1].width;
			kaSenList[six].style.backgroundImage = `linear-gradient(90deg, transparent ${x}px, var(--ka-selectColor) ${x}px)`;
			kaSenList[eix].style.backgroundImage = `linear-gradient(90deg, var(--ka-selectColor) ${w}px, transparent ${w}px)`;
			for (let i = six + 1; i < eix; i++)
			kaSenList[i].style.backgroundImage = `linear-gradient(var(--ka-selectColor) 100%, var(--ka-selectColor) 100%)`;
		}
	}

	updateCursor() {

		const { kaTxtCursor, kaContainer, kaRgo } = this;

		const is_empty   = kaRgo.startContainer.length === 0;
		if  ( is_empty ) kaRgo.startContainer.appendData('\xA0');
		let { left,top } = kaRgo.getBoundingClientRect();
		if  ( is_empty ) kaRgo.startContainer.deleteData(0, 1);

		const a = kaContainer.getBoundingClientRect();
		kaTxtCursor.style.left = `${left - a.left}px`;
		kaTxtCursor.style.top  = `${top  - a.top }px`;
	}

	deleteBackward() {

		const { kaPa, kaSen, kaRgo } = this;

		let cont = kaRgo.startContainer,
		     pos = kaRgo.startOffset;

		if (pos > 0) {
			cont.deleteData(--pos, 1);
		} else {
			let xRes = this.getContext(kaSen, XPathResult.ORDERED_NODE_ITERATOR_TYPE),
			    prev = xRes.iterateNext(), next;

			if (prev !== cont) {
				while ((next = xRes.iterateNext()) && cont !== next)
					prev = next;
				if (!cont.length) {
					do {
					   next = cont.parentNode;
					} while (next !== kaSen && next.childNodes.length === 1);
					next.removeChild(cont);
				}
				prev.deleteData((pos = prev.length - 1), 1);
				cont = prev;
			} else {
				let list = this.kaSenList,
				    pidx = list.indexOf(kaSen);
				if (pidx > 0) {
					xRes = this.getContext((next = list[--pidx])),
					cont = xRes.snapshotItem(xRes.snapshotLength - 1),
					pos  = cont.length;
					next.append( ...kaSen.childNodes), kaPa.remove();
					next.setAttribute('name', 'ka_pasen');
					next.parentNode.setAttribute('name', 'ka_parent');
				}
			}
		}
		kaRgo.setStart(cont, pos);
		kaRgo.setEnd(cont, pos);
	}

	clearSelected(toDel = true) {
		const { kaRgo } = this;
		const hadSelect = !kaRgo.collapsed;

		if (hadSelect) {
			if (toDel)
				kaRgo.deleteContents();
			else
				kaRgo.collapse();
			for(const kasen of this.kaSenList)
				kasen.style.backgroundImage = null;
		}
		return hadSelect;
	}

	insertParagraph() {

		const { kaPa, kaSen, kaRgo } = this;

		const xRes = this.getContext(kaSen),
		      xLen = xRes.snapshotLength;

		let nkapa = document.createElement('ka-pa'), cont = kaRgo.startContainer,
		    nline = document.createElement('ka-sen'), pos = kaRgo.startOffset;

		if (cont === xRes.snapshotItem(0) && pos === 0) {
			kaPa.before(nkapa), nline.append('');
			if (kaSen.hasAttribute('kana-text')) {
				kaSen.removeAttribute('kana-text');
				nline.setAttribute('kana-text', this.placeholder);
			}
		} else {
			if (cont === xRes.snapshotItem(xLen - 1) && pos === cont.length) {
				cont = nline.appendChild( document.createTextNode('') );
			} else {
				if (pos === 0) {
					let parent = cont.parentNode;
					while (parent !== kaSen && !parent.previousSibling)
					    parent = parent.parentNode;
					kaRgo.setStartBefore(parent);
				} else
					kaRgo.setStart(cont, pos);
				kaRgo.setEndAfter(kaSen.lastChild);
				nline.append( kaRgo.extractContents() );
				cont = this.getContext(nline, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;
			}
			nkapa.setAttribute('name', 'ka_parent'), kaPa.removeAttribute('name');
			nline.setAttribute('name', 'ka_pasen'), kaSen.removeAttribute('name');
			kaPa.after(nkapa);
		}
		nkapa.append(nline);
		kaRgo.setStart(cont, 0);
		kaRgo.setEnd(cont, 0);
	}

	handleEvent({ inputType, data }) {

		const { selectionStart: start, selectionEnd: end, value: txt } = this.kaTextArea;
		switch( inputType ) {
		case 'insertText':
			this.clearSelected();
			if (!data) {
				/* !Chrome Bug: 
				  after some text inputed, the first trigger 
				  `insertLineBreak` handled as `insertText`
				  with null data.
				  
				 * AppleWebKit/537.36 (KHTML, like Gecko)
				 * Chrome/91.0.4472.114
				 * Safari/537.36
				 */
				if ('\n' === txt.substring(start - 1, start))
					this.insertParagraph();
			} else
				this.insertText(data);
			break;
		case 'insertLineBreak':
			this.clearSelected();
			this.insertParagraph();
			break;
		case 'deleteContentBackward':
			if(!this.clearSelected())
				this.deleteBackward();
			break;
		}
		this.updateCursor();
	}
};
customElements.define('ka-input', KanakoInput);

if (!('rangeParent' in UIEvent.prototype)) {
	const getRange = (functName, parentName, offsetName, y) => (function() {
		const range = document[functName](this.clientX, this.clientY),
		     parent = range[parentName],
		     offset = range[offsetName];
		Object.defineProperties(this, {
			rangeParent: { value: parent, enumerable: true },
			rangeOffset: { value: offset, enumerable: true },
		});
		return y ? parent : offset;
	});
	if ('caretRangeFromPoint' in document) {
		Object.defineProperties(UIEvent.prototype, {
			rangeParent: { get: getRange('caretRangeFromPoint', 'startContainer', 'startOffset', true), configurable: true, enumerable: true },
			rangeOffset: { get: getRange('caretRangeFromPoint', 'startContainer', 'startOffset', false), configurable: true, enumerable: true }
		});
	} else if ('caretPositionFromPoint' in document) {
		Object.defineProperties(UIEvent.prototype, {
			rangeParent: { get: getRange('caretPositionFromPoint', 'offsetNode', 'offset', true), configurable: true, enumerable: true },
			rangeOffset: { get: getRange('caretPositionFromPoint', 'offsetNode', 'offset', false), configurable: true, enumerable: true }
		});
	}
}
