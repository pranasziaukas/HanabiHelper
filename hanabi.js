var HanabiHelper = {
	cards: {},
	colours: ['red', 'yellow', 'green', 'blue', 'white', 'multicolor'],
	isFirefox: (navigator.userAgent.toLowerCase().indexOf('firefox') > -1),
	isChrome: (navigator.userAgent.toLowerCase().indexOf('chrome') > -1),
	isBookmarklet: !(self.options || (typeof(chrome) !== 'undefined' && typeof(chrome.extension) !== 'undefined') || (typeof(safari) !== 'undefined' && typeof(safari.extension) !== 'undefined')),

	getURL: function(filename) {
		if (HanabiHelper.isBookmarklet) {
			return 'http://www.stephenmcintosh.com/hanabi/' + filename;
		}
		else if (HanabiHelper.isFirefox) {
			return self.options.baseUrl + filename;
		}
		else if (HanabiHelper.isChrome) {
			return chrome.extension.getURL(filename);
		}
	},

	loadJS: function(url, callback) {
		var c=document.createElement('script');
		c.setAttribute('src', url);
		if (callback) {
			c.onload=c.onreadystatechange=function(){
				if(!(d = this.readyState) || d == "loaded" || d == "complete") {
					callback();
				}
			}
		}
		document.body.appendChild(c);
	},

	loadCSS: function(url) {
		var link = document.createElement("LINK");
		link.href = url;
		link.type = "text/css";
		link.rel = "stylesheet";
		document.getElementsByTagName("HEAD")[0].appendChild(link);
	},

	hasClass: function(element, cls) {
	    return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
	},
	addClass: function(element, cls) {
		if (!HanabiHelper.hasClass(element, cls)) {
			element.className += ' ' + cls;
		}
	},

	isInt: function(x) {
		var y = parseInt(x, 10);
		return !isNaN(y) && x == y && x.toString() == y.toString();
	},

	getGameType: function() {
		var multicolourPile = document.getElementById('firework_card_multicolor');
		var multicolourClue = document.getElementById('buttons_item_11');

		if (!multicolourPile) {
			return '5colour';
		}
		else if (multicolourClue) {
			return '6colour';
		}
		else {
			return 'rainbow';
		}
	},

	catchUp: function() {
		var playerNodes = document.getElementsByClassName("playertable");
		for (var i=0; i<playerNodes.length; i++) {
			var playerNode = playerNodes[i];
			if (playerNode) {
				var cardNodes = playerNode.getElementsByClassName('card');
			    for (var j=0; j<cardNodes.length; j++) {
			    	var cardNode = cardNodes[j];
			    	var clueNodes = cardNode.getElementsByClassName('clue');
			    	for (var k=0; k<cardNodes.length; k++) {
			    		var clueNode = clueNodes[k];
			    		if (clueNode && clueNode.style) {
			    			var styleString = clueNode.style.backgroundImage;
				    		var clue = styleString.match(/Token(.*?).png/);
				    		if (clue && (clue.length >= 2)) {
				    			clue = clue[1];
				    			clue = clue.toLowerCase();
				    			if (clue != 'unknown' && clue != 'empty') {
						    		HanabiHelper.processClue(clue, cardNode, true);
						    	}
					    	}
				    	}
			    	}
			    }
			}
		}
	},

	observeDomChanges: function() {
		if (HanabiHelper.domObserver) {
			// Setup a listener to react to changes in the dom
			HanabiHelper.domObserver.observe(document.body, {
			    // Childlist = observe additions or deletions of child nodes. The callback just has to ignore the deletions.
			    'childList': true, 
			    // By default it just observes direct children - this makes it do grandchildren, great-grandchildren etc.
			    'subtree': true
			});
		}
	},
	unobserveDomChanges: function() {
		if (HanabiHelper.domObserver) {
			HanabiHelper.domObserver.disconnect();
		}
	},
	domChangeCallback: function(mutations) {
		// Respond to a dom change
		// Stop observing so as to avoid picking-up on the values and colours divs being inserted
		HanabiHelper.unobserveDomChanges();

		mutations.map(function(mutation) {
			if (mutation.addedNodes.length > 0) {			    
			    var moves = document.getElementsByClassName("log");
			    var moveNode;
			    for (i in moves) {
			    	moveNode = moves[i];
			    	if (!HanabiHelper.hasClass(moveNode, 'logchat')) {
			    		break;
			    	}
			    }
				if (moveNode) {
					var move = moveNode.innerText;
					if (move) {
						var clue = move.match(/clue (.*?) to (.*)/);

						if (clue) {
							var toPlayerName = clue[2];
							clue = clue[1];

							var playerNodes = document.getElementsByClassName("playertablename");
							for (var i in playerNodes) {
								if (playerNodes[i].innerText == toPlayerName) {
									var cardNodes = playerNodes[i].parentNode.getElementsByClassName('card');
								    for (var i in cardNodes) {
								    	HanabiHelper.processClue(clue, cardNodes[i], false);
								    }
								}
							}
							HanabiHelper.updateDisplay();
					    }
					}
				}
			}
		});

	    // Restart the observer
	    HanabiHelper.observeDomChanges();
	},

	processClue: function(clue, card, ignoreActive) {
		var gameType = HanabiHelper.getGameType();

		function blank(card, clue) {
			var clueType = HanabiHelper.isInt(clue) ? 'number' : 'colour';
			var max = 5;
			if (clueType == 'colour' && gameType == '6colour') {max = 6;}
			for (var i=1; i<=max; i++) {
				var key = '';
				if (clueType == 'colour') {
					key += HanabiHelper.colours[i-1];
				}
				else {
					key += i;
				}
				if (key != clue) {
					card['is' + key] = false;
				}
			}
		}

		var active = HanabiHelper.hasClass(card, 'active_element') || ignoreActive;

		var rec = HanabiHelper.cards[card.id];
		if (!rec) {
			rec = {
				'id': card.id
			};
		}
		if (rec) {
			if (!HanabiHelper.isInt(clue) && gameType == 'rainbow') {
				if (active) {
					for (var i=0; i<5; i++) {
						var colour = HanabiHelper.colours[i];
						if (clue != colour) {
							if (rec['is' + colour]) { // must be multi
								blank(rec, clue);
								rec['is' + HanabiHelper.colours[5]] = true;
							}
							else {
								rec['is' + colour] = false;
							}
						}
					}
				}
				else { // can't be multi
					rec['is' + HanabiHelper.colours[5]] = false;
				}
			}
			else {
				if (active) {blank(rec, clue);}
			}
			if (typeof(rec['is' + clue]) === 'undefined') {
				rec['is' + clue] = active;
			}
		}
		HanabiHelper.cards[card.id] = rec;
	},

	updateDisplay: function() {
		function removeNode(node) {
			node.parentNode.removeChild(node);
		}
		function addMarker(node, marker, positive) {
			var markerNode = document.createElement('div');
			if (positive) {
				markerNode.setAttribute('class', 'hanabiHelper-marker hanabiHelper-positive hanabiHelper-' + marker);
			}
			else {
				markerNode.setAttribute('class', 'hanabiHelper-marker hanabiHelper-' + marker);
			}
			node.appendChild(markerNode);
		}

		// Hide bga clues
		var clueNodes = document.getElementsByClassName('clue');
		for (var i in clueNodes) {
			var clueNode = clueNodes[i];
			HanabiHelper.addClass(clueNode, 'hanabiHelper-hidden');
			//HanabiHelper.addClass(clueNode, 'small');
		}

		for (i in HanabiHelper.cards) {
			var card = HanabiHelper.cards[i];
			var cardNode = document.getElementById(card.id);
			if (cardNode) {
				var valuesDiv = cardNode.getElementsByClassName('hanabiHelper-values')[0];
				if (valuesDiv) {
					removeNode(valuesDiv);
				}
				var coloursDiv = cardNode.getElementsByClassName('hanabiHelper-colours')[0];
				if (coloursDiv) {
					removeNode(coloursDiv);
				}

				valuesDiv = document.createElement('div');
				var positive = false;
				for (var n=1; n<=5; n++) {
					if (card['is' + n] == false) {
						addMarker(valuesDiv, 'blank');
					}
					else if (card['is' + n] == true) {
						addMarker(valuesDiv, n, true);
						positive = true;
					}
					else {
						addMarker(valuesDiv, n);
					}
				}
				valuesDiv.setAttribute('class', 'hanabiHelper-values hanabiHelper-size-' + (positive ? '1' : '5'));
				cardNode.appendChild(valuesDiv);

				coloursDiv = document.createElement('div');

				var count = 0;
				var positive = false;
				var rainbowLarge = false;
				var gameType = HanabiHelper.getGameType();
				if (gameType == '5colour') {
					var max = 5;
				}
				else {
					var max = 6;
				}
				for (var n=0; n<max; n++) {
					var colour = HanabiHelper.colours[n];

					if (card['is' + colour] == false) {
						addMarker(coloursDiv, 'blank');
					}
					else if (card['is' + colour] == true) {
						addMarker(coloursDiv, colour, true);
						positive = true;
						count++;
					}
					else {
						addMarker(coloursDiv, colour);
						count++;
						if (n==5 && gameType == 'rainbow' && count == 2) {
							rainbowLarge = true;
						}
					}
				}
				coloursDiv.setAttribute('class', 'hanabiHelper-colours hanabiHelper-size-' + (positive || rainbowLarge ? '1' : max));
				cardNode.appendChild(coloursDiv);
			}
		}
	},

	load: function() {
		// Check we're on a hanabi game page
		if (!document.getElementById('firework_wrap')) {
			return;
		}
		HanabiHelper.loadCSS(HanabiHelper.getURL('hanabi.css'));

		HanabiHelper.catchUp();
		HanabiHelper.updateDisplay();

		// Setup the mutation observer to pickup any changes to the DOM
		if (typeof(MutationObserver) !== 'undefined') {
			HanabiHelper.domObserver = new MutationObserver(HanabiHelper.domChangeCallback);
			HanabiHelper.observeDomChanges();
		}

		// If this isn't a replay
		if (!document.getElementById('archive_next')) {
			HanabiHelper.loadJS(HanabiHelper.getURL('announce.js'));
		}
	}
}

HanabiHelper.load();