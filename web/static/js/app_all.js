let config = {
  iceServers: [{
    urls: ["stun:stun.l.google.com:19302"]
  }]
};

let suuidMap = {}
$('video').each((i,elem) => {
	let suuid = elem.id.split("-").pop()
	let stream = new MediaStream();
	const pc = new RTCPeerConnection(config);

	suuidMap[suuid] = {
		'suuid': suuid,
		'stream': stream,
		'pc': pc,
		'elem': elem,
	}

	pc.onnegotiationneeded = () => { handleNegotiationNeededEvent(suuid, pc) };
	pc.oniceconnectionstatechange = e => log(suuid, pc.iceConnectionState)

	pc.ontrack = function(event) {
		stream.addTrack(event.track)
		elem.srcObject = stream;
		log(suuid, event.streams.length + ' track is delivered')
	}
})

let log = (suuid, msg) => {
	document.getElementById('log-' + suuid).innerHTML += '[' + suuid + ']: ' + msg + '<br>'
}

async function handleNegotiationNeededEvent(suuid, pc) {
  	let offer = await pc.createOffer();
  	await pc.setLocalDescription(offer);
  	getRemoteSdp(suuid, pc);
}

function getRemoteSdp(suuid, pc) {
  $.post("../receiver/" + suuid, {
    suuid: suuid,
    data: btoa(pc.localDescription.sdp)
  }, function(data) {
    try {
		pc.setRemoteDescription(new RTCSessionDescription({
			type: 'answer',
			sdp: atob(data)
		}))
    } catch (e) {
      console.warn(e);
    }
  });
}

$(document).ready(function() {
	$.each(suuidMap, (suuid, entry) => {
		$(entry['elem']).addClass('active')
		getCodecInfo(suuid, entry['pc'])

	})
});

function getCodecInfo(suuid, pc) {
  $.get("../codec/" + suuid, function(data) {
    try {
      data = JSON.parse(data);
    } catch (e) {
      console.warn(e);
    } finally {
      $.each(data,function(index,value){
        pc.addTransceiver(value.Type, {
          'direction': 'sendrecv'
        })
      })
    }
  });
}
