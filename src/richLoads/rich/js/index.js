var CraftWW = CraftWW || {};

( function () {
	"use strict";
	
	var endFrameTimeline, width, height, introVideo, morph3DTimer, 
		introMorph3DVideo, introTeamsVideo, introDesignerVideo, endFrameVideo, teamsMainVideo, designerMainVideo;
	
	CraftWW.init = function () {
		// Initialize any variables here
		idsToVars();

		width = 970;
		height = 250;

		morph3DTimer = 3;

		introVideo = myFT.$('#introVid');
		introMorph3DVideo = myFT.$('#introMorph3DVid');
		introTeamsVideo = myFT.$('#introTeamsVid');
		introDesignerVideo = myFT.$('#introDesignerVid');
		endFrameVideo = myFT.$('#endFrameVid');
		teamsMainVideo = myFT.$('#teamsMainVid');
		designerMainVideo = myFT.$('#designerMainVid');
		
		clickThrough = myFT.$( "#clickThrough" );
		morph3D_BG = myFT.$( "#morph3D_BG" );

		wrapper.className += "show";

		initInteractions();

		initAnimation();

		setup3D();

		startAnimation();
		
	};
	
	
	function initAnimation() {
		// TweenMax can be used to set css
		// It will even take care of browser prefixes
		// TweenMax.set(logo, {x:100, y:50, opacity:0});

		TweenMax.set([menuBtn1, menuBtn2, menuBtn3], {backgroundColor: "rgba(216,59,1,0.5)", x:width});
		TweenMax.set([backBtn, morph3D_holder, teamsMainVid_holder, designerMainVid_holder, introDesignerVid_holder, introTeamsVid_holder, introMorph3DVid_holder, endFrameVid_holder], {autoAlpha:0});

		introVideo[0].addEventListener('ended', function(){
			TweenMax.to(introMorph3DVid_holder, .6, {autoAlpha:1});
			TweenMax.set(menuBtn1, {backgroundColor: "rgba(216,59,1,1)"});
			menuIn();
			introMorph3DVideo[0].play();
			introMorph3DVideo[0].addEventListener('ended', function(){
				TweenMax.to(introTeamsVid_holder, .6, {autoAlpha:1});
				TweenMax.to(menuBtn1, 0.3, {backgroundColor: "rgba(216,59,1,0.5)"});
				TweenMax.to(menuBtn2, 0.3, {backgroundColor: "rgba(216,59,1,1)"});
				introTeamsVideo[0].play();
				introTeamsVideo[0].addEventListener('ended', function(){
					TweenMax.to(introDesignerVid_holder, .6, {autoAlpha:1});
					TweenMax.to(menuBtn2, 0.3, {backgroundColor: "rgba(216,59,1,0.5)"});
					TweenMax.to(menuBtn3, 0.3, {backgroundColor: "rgba(216,59,1,1)"});
					introDesignerVideo[0].play();
					introDesignerVideo[0].addEventListener('ended', function(){
						endFrameVideo[0].play();
						TweenMax.to(endFrameVid_holder, .6, {autoAlpha:1});
						TweenMax.to(menuBtn3, 0.3, {backgroundColor: "rgba(216,59,1,0.5)", onComplete:initMenuButtons});
						endFrameTimeline.play();
					});
				});
			});
		});

		endFrameTimeline = new TimelineMax();
		endFrameTimeline.pause();
		endFrameTimeline.add("frame1")
			.from(logo, .4, {alpha:0}, "frame1")
			.from(endFrame_copy, .4, {alpha:0}, "frame1+=.4")
			.from(cta, .4, {alpha:0}, "frame1+=1")
			.from(endFrame_BG, .8, {autoAlpha:0}, "frame1+=1")
			.from(replayBtn, .4, {autoAlpha:0}, "frame1+=1.4")
	};

	function startAnimation() {
		// Code for animation
		introVideo[0].play();
	};

	function initInteractions() {
		backBtn.addEventListener('click', function(){
			myFT.tracker('Back_Click');
			goBack();
		});

		morph3DModel.addEventListener('mousedown', function(){
			TweenMax.to([morph3D_copy, frameGrabber], .2, {autoAlpha:0});
		});

		morph3DModel.addEventListener('mouseup', function(){
			TweenMax.to([morph3D_copy, frameGrabber], .2, {autoAlpha:1});
		});

		morph3D_holder.addEventListener('mouseup', function(){
			TweenMax.to([morph3D_copy, frameGrabber], .2, {autoAlpha:1});
		});


		replayBtn.addEventListener('mouseover', function(e) {
			TweenMax.fromTo(replayBtn, 0.5, {rotation:0, transformOrigin:"11px 11px"},{rotation:360});
		});

		replayBtn.addEventListener('click', function(e){
			myFT.tracker('Replay_Click');
			removeMenuBtnListeners()
			initAnimation();
			startAnimation();
		});

		myFT.applyClickTag( clickThrough, 1 ); 

		myFT.applyClickTag( morph3D_BG, 1 ); 

	};

	function initMenuButtons(){
		var elements = document.querySelectorAll(".menuBtn");
		for (var i = 0; i < elements.length; i++) {
		  	elements[i].addEventListener("mouseover", function() {
				TweenMax.to(this, 0.3, {backgroundColor: "rgba(216,59,1,1)"});
		  	});

		  	elements[i].addEventListener("mouseout", function() {
				TweenMax.to(this, 0.3, {backgroundColor: "rgba(216,59,1,.5)"});
		  	});

		}

		menuBtn1.addEventListener('click', function(){
			myFT.tracker('MenuBtn1_Click');
			show3D();
		});

		menuBtn2.addEventListener('click', function(){
			myFT.tracker('MenuBtn2_Click');
			showMainVid(teamsMainVid_holder, teamsMainVideo);
		});

		menuBtn3.addEventListener('click', function(){
			myFT.tracker('MenuBtn3_Click');
			showMainVid(designerMainVid_holder, designerMainVideo);
		});
	}

	function removeMenuBtnListeners(){

		//clone each menu btn to remove all listeners
		var elements = document.querySelectorAll(".menuBtn");
		for (var i = 0; i < elements.length; i++) {
			var old_element = elements[i];
			var new_element = old_element.cloneNode(true);
			old_element.parentNode.replaceChild(new_element, old_element);

			//add references to them again
			window[new_element.id] = document.getElementById(new_element.id);

		}
	}

	function show3D(){
		menuOut();
		TweenMax.to(morph3D_holder, .5, {autoAlpha:1})
		TweenMax.to(backBtn, .3, {autoAlpha:1, delay:0.5});
		morph3DTimerDelay();
	}

	function morph3DTimerDelay(){
	    wrapper.addEventListener("mousemove", morph3DTimerReset);
		TweenMax.delayedCall(morph3DTimer, endMorph3D);
	}

	function morph3DTimerReset(){
		TweenMax.killTweensOf(endMorph3D);
		TweenMax.delayedCall(morph3DTimer, endMorph3D);
	}

	function endMorph3D(){
	    wrapper.removeEventListener("mousemove", morph3DTimerReset);
		TweenMax.killTweensOf(endMorph3D);
		goBack();
	}

	function showMainVid(whichHolder, whichVideo){
		menuOut();

		TweenMax.to(backBtn, .3, {autoAlpha:1, delay:0.5});
		TweenMax.to(whichHolder, .5, {autoAlpha:1});

		whichVideo[0].play();
		whichVideo[0].addEventListener('ended', function(){
			goBack();
		});
	}

	function menuOut(){
		TweenMax.staggerTo([menuBtn1, menuBtn2, menuBtn3], .5, {x:width, ease:Back.easeIn}, 0.1);
	}

	function menuIn(){
		TweenMax.staggerTo([menuBtn1, menuBtn2, menuBtn3], .5, {x:728, ease:Back.easeOut}, 0.1);
	}

	function goBack(){
		TweenMax.to(backBtn, .3, {autoAlpha:0});
		TweenMax.to(morph3D_holder, .5, {autoAlpha:0})
		TweenMax.to(teamsMainVid_holder, .5, {autoAlpha:0, onComplete:stopVideo, onCompleteParams:[teamsMainVideo]})
		TweenMax.to(designerMainVid_holder, .5, {autoAlpha:0, onComplete:stopVideo, onCompleteParams:[designerMainVideo]})
		menuIn();
	}

	function stopVideo(whichOne){
		whichOne[0].stop();
	}

	function setup3D(){
		var loader = new THREE.FileLoader();
		loader.load( 'img/app.json', function ( text ) {

			var player = new APP.Player();
			player.load( JSON.parse( text ) );
			player.setSize( 300, 250 );
			player.play();

			document.getElementById("morph3DModel").appendChild( player.dom );
		} );
	}

	//SET IDs IN DOM TO GLOBAL VARIABLES
	function idsToVars() {
		[].slice.call(document.querySelectorAll('*')).forEach(function(el) {
			if (el.id) window[el.id] = document.getElementById(el.id);
		});
	}
} ) ();