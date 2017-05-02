import { Component } from '@angular/core';
import { NavParams, ViewController, ModalController } from 'ionic-angular';
import { Chat } from '../../providers/chat';
import { toggleFade } from '../../includes/animations';
import { ShareListModal } from '../sharelist/sharelist';

import { SocialSharing } from '@ionic-native/social-sharing';

@Component({
  selector: 'modal-feedbackshare',
  templateUrl: 'feedbackshare.html',
  animations: [
    toggleFade
  ]
})
export class FeedbackShareModal {

  private mainBtn: any = {
    state: 'fadeOut',
    hidden: false
  }

  private share: any = {
    message: null,
    image: null,
    url: null
  }

  constructor(
    private params: NavParams,
    private viewCtrl: ViewController,
    private modalCtrl: ModalController,
    public chatPrvd: Chat,
    private socialShare: SocialSharing
  ) {}

  shareViaFacebook() {
    this.socialShare.shareViaFacebookWithPasteMessageHint(
      this.share.message,
      this.share.image,
      this.share.url,
      this.share.message
    ).then((succ) => {
      console.log('[Facebook share] Success:', succ);
    }).catch(err => {
      console.log('[Facebook share] Error:', err);
    });
  }

  chooseToShare() {
    let sharelistModal = this.modalCtrl.create(ShareListModal);
    sharelistModal.present();
  }

  closeModal() {
    this.viewCtrl.dismiss();
  }

  ionViewDidEnter() {
    this.share.message = this.params.get('message');
    this.mainBtn.state = 'fadeInfast';
  }
}
