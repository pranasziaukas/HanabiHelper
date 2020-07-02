HanabiHelperAnnouncer = {
	announced: false,
	keydown: function(target, k) {
	    var oEvent = document.createEvent('KeyboardEvent');

	    // Chromium Hack
	    Object.defineProperty(oEvent, 'keyCode', {
            get : function() {
                return this.keyCodeVal;
            }
	    });     
	    Object.defineProperty(oEvent, 'which', {
            get : function() {
                return this.keyCodeVal;
            }
	    });     

	    if (oEvent.initKeyboardEvent) {
	        oEvent.initKeyboardEvent("keyup", true, true, document.defaultView, false, false, false, false, k, k);
	    } else {
	        oEvent.initKeyEvent("keyup", true, true, document.defaultView, false, false, false, false, k, 0);
	    }

	    oEvent.keyCodeVal = k;

	    if (oEvent.keyCode !== k) {
	        alert("keyCode mismatch " + oEvent.keyCode + "(" + oEvent.which + ")");
	    }

	    target.dispatchEvent(oEvent);
	},
	announce: function() {
		// If we haven't yet announced our presence...
		if (!HanabiHelperAnnouncer.announced) {
			var chatBox = document.getElementById('chatinput_input');
			if (typeof(chatBox) !== 'undefined') {
				chatBox.value = 'HanabiHelper loaded';
				HanabiHelperAnnouncer.keydown(chatBox, 13);
				HanabiHelperAnnouncer.announced = true;
			}
		}
	}
};

setTimeout(HanabiHelperAnnouncer.announce, 2000);