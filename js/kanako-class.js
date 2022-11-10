
class KanakoInput extends Range {

	constructor(params = {}) {
	super();
		const _txt_ = 'textarea', {
			place_text = 'Message Text',
			color_select = '#c0dbae'
		} = params;
	
		const ka_nako    = _setup('div', { class: 'ka-nako'   , style: 'position: relative; user-select: none; width: 330px; height: 160px;' });
		const ka_resize  = _setup('div', { class: 'ka-resize' , style: 'position: absolute; bottom: 1px; right: 1px;' });
		const ka_txtarea = _setup(_txt_, { class: 'ka-txtarea', style: 'position: absolute; left: 0; top: 0; width: 0; height: 0; margin: 0; outline: none; resize: none; border: none; cursor: text;' });
		const ka_hikon   = _setup('div', { class: 'ka-hikon'  , style: 'position: absolute; left: 0; top: 0; width: 100%; height: 100%;' });
		const ka_content = _setup('div', { class: 'ka-content', style: 'position: absolute; left: 0; top: 0; width: 100%; height: 100%;' });
		const ka_cursor  = _setup('div', { class: 'ka-cursor', style: 'position: absolute; left: 0; top: 0;' });
		const ka_naidate = _setup('div', { class: 'ka-naidate', style: 'position: absolute; left: 0; top: 0;' });

		ka_nako.append( ka_txtarea, ka_hikon, ka_resize );
		ka_hikon.append( ka_content, ka_cursor, ka_naidate );

		let ka_pa  = _setup('div' , { class: 'ka-pa', name: 'ka_parent' }),
		    ka_sen = _setup('span', { class: 'ka-sen', name: 'ka_pasen', 'nako-place': place_text }),
		    tx_ctx = null, _wnk_ = new AnimFrameTracking(
				() => ka_cursor.classList.toggle('wink-ko')
			);

		ka_content.appendChild(ka_pa).appendChild(ka_sen).append('');
		ka_txtarea.addEventListener('input', this);
		ka_txtarea.addEventListener('blur', () => {
			_wnk_.reset(false), ka_cursor.classList.remove('wink-ko');
		});
		ka_nako.addEventListener(UIDragable.DOWN, e => {
			const el = e.target,
			   eclas = el.classList[0],
			   point = UIDragable.getPoint(e);
			if(eclas === 'ka-txtarea' || eclas === 'ka-cursor' || !point)
				return;
			if(eclas === 'ka-resize') {
				point.action = 'resize';
				point.minW = point.minH = 50;
			} else {
				const s_cont = e.rangeParent,
				      s_pos  = e.rangeOffset;
				_wnk_.reset(true), ka_cursor.classList.add('wink-ko');
				this.selectionStart(s_cont, s_pos);
				point.callback = e => {
					if (ka_cursor !== e.target && e.type.endsWith('move'))
						this.selectionEnd(e.rangeParent, e.rangeOffset);
				}
			}
			e.stopPropagation();
			e.preventDefault();
			UIDragable.live(ka_nako, point);
		});
		super.selectNodeContents(ka_sen.firstChild);

		const getContext = (el, type = XPathResult.ORDERED_NODE_SNAPSHOT_TYPE) => {
			if(!tx_ctx)
				tx_ctx = new XPathEvaluator().createExpression('.//text()');
			return tx_ctx.evaluate(el, type);
		}
		Object.defineProperties(this, {
			kaNakoInput: { value: ka_nako, enumerable: true },
			kaTextArea : { value: ka_txtarea },
			kaContainer: { value: ka_content },
			kaTxtCursor: { value: ka_cursor },
			kaPlaceText: { value: place_text, writable: true },
			getContext : { value: getContext },

			kaPaList : { get: () => ka_content.children },
			kaSenList: { get: () => ka_content.getElementsByClassName('ka-sen') }
		});
		if (true)
			ka_txtarea.style.left = ka_txtarea.style.width = ka_txtarea.style.height = '100%';
	}

	insertText(txt = '') {

		let cont = super.startContainer,
		     pos = super.startOffset;

		cont.insertData(pos, txt);
		pos += txt.length;

		super.setStart(cont, pos);
		super.setEnd(cont, pos);
	}

	selectionStart(cont, pos) {

		const { kaSenList, kaTextArea } = this;

		let seList = Array.from(kaSenList),
		    offset = new Array(seList.length),
		   seIndex = seList.indexOf(cont);

		if (seIndex >= 0) {
			let res = this.getContext(cont);
			cont = res.snapshotItem(res.snapshotLength - 1),
			pos  = cont.length;
		} else {
			let parent = cont.parentNode;
			while ((seIndex = seList.indexOf(parent)) === -1)
			    parent = parent.parentNode;
		}
		for (let i = 0, o = 0, v = kaTextArea.value; i < seList.length; i++) {
			offset[i] = o, o = v.indexOf('\n', o) + 1;
			seList[i].style.backgroundImage = null;
		}
		super.setStart(cont, pos);
		super.setEnd(cont, pos);
		this.updateCursor();
	}

	selectionEnd(cont, pos) {
		/* todo */
	}

	updateCursor = () => {

		const is_empty   = super.startContainer.length === 0;
		if  ( is_empty ) super.startContainer.appendData('\xA0');
		let { left,top } = super.getBoundingClientRect();
		if  ( is_empty ) super.startContainer.deleteData(0, 1);
		
		const ne = this.kaContainer.getBoundingClientRect();
		this.kaTxtCursor.style.left = `${left - ne.left}px`;
		this.kaTxtCursor.style.top  = `${top  - ne.top }px`;
	}

	deleteBackward() {

		let cont = super.startContainer,
		     pos = super.startOffset;

		if (pos > 0) {
			cont.deleteData(--pos, 1);
		} else {
			const { kaPaList, kaSenList } = this;
			const kaParent = kaPaList.ka_parent,
			      kaLine   = kaSenList.ka_pasen;

			let xRes = this.getContext(kaLine, XPathResult.ORDERED_NODE_ITERATOR_TYPE),
			    prev = xRes.iterateNext(), next;

			if (prev !== cont) {
				while ((next = xRes.iterateNext()) && cont !== next)
					prev = next;
				if (!cont.length) {
					do {
					   next = cont.parentNode;
					} while (next !== kaLine && next.childNodes.length === 1);
					next.removeChild(cont);
				}
				prev.deleteData((pos = prev.length - 1), 1);
				cont = prev;
			} else {
				let list = Array.from(kaSenList),
				    pidx = list.indexOf(kaLine);
				if (pidx > 0) { kaParent.remove();
					xRes = this.getContext((next = list[--pidx]));
					next.append( ...kaLine.childNodes);
					next.setAttribute('name', 'ka_pasen');
					next.parentNode.setAttribute('name', 'ka_parent');
					cont = xRes.snapshotItem(xRes.snapshotLength - 1),
					pos  = cont.length;
				}
			}
		}
		super.setStart(cont, pos);
		super.setEnd(cont, pos);
	}

	clearSelected(del = true) {

		if (!super.collapsed) {
			if (del)
				super.deleteContents();
			else
				super.collapse();
			for(const kasen of this.kaSenList)
				kasen.style = '';
			return true;
		}
		return false;
	}

	insertParagraph() {

		const kaPa  = this.kaPaList.ka_parent,
		      kaSen = this.kaSenList.ka_pasen,
		      xRes  = this.getContext(kaSen),
		      xLen  = xRes.snapshotLength;

		let nkapa = document.createElement('div'), cont = super.startContainer,
		    nline = document.createElement('span'), pos = super.startOffset;

		let action = 'after';
		if (cont === xRes.snapshotItem(0) && pos === 0) {
			action = 'before', nline.append('');
			if (kaSen.hasAttribute('nako-place')) {
				kaSen.removeAttribute('nako-place');
				nline.setAttribute('nako-place', this.kaPlaceText);
			}
		} else {
			if (cont === xRes.snapshotItem(xLen - 1) && pos === cont.length) {
				cont = nline.appendChild( document.createTextNode('') );
			} else {
				if (pos === 0) {
					let parent = cont.parentNode;
					while (parent !== kaSen && !parent.previousSibling)
					    parent = parent.parentNode;
					super.setStartBefore(parent);
				} else
					super.setStart(cont, pos);
				super.setEndAfter(kaSen.lastChild);
				nline.append( super.extractContents() );
				cont = this.getContext(nline, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;
			}
			nkapa.setAttribute('name', 'ka_parent'), kaPa.removeAttribute('name');
			nline.setAttribute('name', 'ka_pasen'), kaSen.removeAttribute('name');
		}
		nkapa.append(nline), nline.className = 'ka-sen';
		kaPa[action](nkapa), nkapa.className = 'ka-pa';
		super.setStart(cont, 0);
		super.setEnd(cont, 0);
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
}

if (!('rangeParent' in UIEvent.prototype)) {
	const mkRangeGetter = (caretFromPoint, node, offset, y) => (function(){
		const range = document[caretFromPoint](this.clientX, this.clientY);
		Object.defineProperties(this, {
			rangeParent: { value: range[node], enumerable: true },
			rangeOffset: { value: range[offset], enumerable: true },
		});
		return range[y ? node : offset];
	});
	if ('caretRangeFromPoint' in document) {
		Object.defineProperties(UIEvent.prototype, {
			rangeParent: { get: mkRangeGetter('caretRangeFromPoint', 'startContainer', 'startOffset', true), configurable: true, enumerable: true },
			rangeOffset: { get: mkRangeGetter('caretRangeFromPoint', 'startContainer', 'startOffset', false), configurable: true, enumerable: true }
		});
	} else if ('caretPositionFromPoint' in document) {
		Object.defineProperties(UIEvent.prototype, {
			rangeParent: { get: mkRangeGetter('caretPositionFromPoint', 'offsetNode', 'offset', true), configurable: true, enumerable: true },
			rangeOffset: { get: mkRangeGetter('caretPositionFromPoint', 'offsetNode', 'offset', false), configurable: true, enumerable: true }
		});
	}
}
