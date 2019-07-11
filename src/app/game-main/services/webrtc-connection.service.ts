import {Injectable} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {webSocket} from 'rxjs/webSocket';

interface SignalingMessage {
  data?: string;
  what: 'offer' | 'answer' | 'message' | 'call';
}

@Injectable({
  providedIn: 'root'
})
export class WebrtcConnectionService {

  constructor() { }

  connect(targetHost: string, signalingServerPath: string): Observable<MediaStream> {
    let pc: RTCPeerConnection;

    const sub = new Subject<MediaStream>();
    const onTrack = (ev: RTCTrackEvent) => {
      sub.next(ev.streams[0]);
      sub.complete();
    };

    const ws = webSocket<SignalingMessage>({
      url: signalingServerPath,
      openObserver: {
        next: value => {
          pc = this.createPeerConnection(onTrack);
          ws.next({what: 'call'});
        }
      },
      closeObserver: {
        next: value => {
          if (pc) {
            pc.close();
            pc = null;
          }
        }
      }
    });

    ws.subscribe(msg => {
      switch (msg.what) {
        case 'offer':
          pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(msg.data)))
            .then(() => pc.createAnswer({offerToReceiveVideo: true, offerToReceiveAudio: false}))
            .then((sessionDescription) => {

              ws.next({
                what: 'answer',
                data: JSON.stringify(sessionDescription)
              });
              return pc.setLocalDescription(sessionDescription);
            })
            .catch(error => console.error(error));
          break;
        case 'answer':
          break;
        default:
          console.log(msg);
          break;
      }
    });


    return sub;
  }

  private createPeerConnection(onTrack?: (evt: RTCTrackEvent) => any, onDataChannel?: (ev: RTCDataChannelEvent) => any): RTCPeerConnection {
    try {
      const pc = new RTCPeerConnection();
      console.log('pc', pc);
      pc.ontrack = onTrack;
      pc.ondatachannel = onDataChannel;
      return pc;
    } catch (e) {
      console.error('createPeerConnection() failed');
    }
  }


}

