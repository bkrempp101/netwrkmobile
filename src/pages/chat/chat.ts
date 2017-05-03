import { Component, ViewChild, NgZone, HostBinding } from '@angular/core';
import { NavController, NavParams, Content, Platform, ModalController } from 'ionic-angular';

import { CameraPreview } from '@ionic-native/camera-preview';

import { CameraPage } from '../camera/camera';
// import { NetworkFindPage } from '../network-find/network-find';
import { FeedbackModal } from '../../modals/feedback/feedback';
import { Toggleable } from '../../includes/toggleable';
import { MessageDateTimer } from '../../includes/messagedatetimer';

// Providers
import { Tools } from '../../providers/tools';
import { UndercoverProvider } from '../../providers/undercover';
import { SlideAvatar } from '../../providers/slide-avatar';
// import { Share } from '../../providers/share';
import { Auth } from '../../providers/auth';
import { Camera } from '../../providers/camera';
import { Chat } from '../../providers/chat';
import { Network } from '../../providers/network';
import { Gps } from '../../providers/gps';

import { ProfilePage } from '../profile/profile';

import { Keyboard } from '@ionic-native/keyboard';

import * as moment from 'moment';

// Animations
import {
  animSpeed,
  chatAnim,
  toggleInputsFade,
  rotateChatPlus,
  toggleChatOptionsBg,
  scaleMainBtn,
  toggleGallery,
  toggleFade,
  slideToggle
} from '../../includes/animations';

@Component({
  selector: 'page-chat',
  templateUrl: 'chat.html',
  animations: [
    toggleInputsFade,
    rotateChatPlus,
    toggleChatOptionsBg,
    scaleMainBtn,
    toggleGallery,
    toggleFade,
    slideToggle
  ],
  providers: [
    Keyboard
  ]
})

export class ChatPage {
  @HostBinding('class') colorClass = 'transparent-background';

  public isUndercover: boolean;

  @ViewChild('galleryCont') gCont;
  @ViewChild('textInput') txtIn;
  @ViewChild(Content) content: Content;

  chatOptions = new Toggleable('default');
  bgState = new Toggleable('compressed');
  shareContainer = new Toggleable('off', true);
  emojiContainer = new Toggleable('off', true);
  mainInput = new Toggleable('fadeIn', false);
  postTimer = new Toggleable('slideUp', true);
  postLock = new Toggleable('slideUp', true);
  chatBtns = new Toggleable(['btnHidden', 'btnHidden', 'btnHidden', 'btnHidden']);

  flipHover: boolean;

  toggContainers: any = [
    this.emojiContainer,
    this.shareContainer
  ];

  private messagesInterval:any;

  emoticX = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C'];
  emoticY = ['1F60', '1F61', '1F62', '1F63', '1F64'];
  emojis = [];

  caretPos: number = 0;

  public postMessages: any = [];

  contentBlock: any = undefined;

  public chatUsers: any = [];

  public user: any;

  public checkbox: any = {
    facebook: false,
    twitter: true,
    linkedin: false
  };

  public sendError: string;
  public showUserSlider: boolean = false;
  private networkParams: any = {};
  private textStrings: any = {};

  private messageDateTimer = new MessageDateTimer();

  public hostUrl: string;
  public placeholderText: string;

  private debug: any = {
    postHangTime: 0
  };
  private postLockData: any = {
    id: null,
    password: null,
    hint: null,
  };
  private contentPadding: string;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public zone: NgZone,
    private cameraPreview: CameraPreview,
    private keyboard: Keyboard,
    // public share: Share,
    public undercoverPrvd: UndercoverProvider,
    public slideAvatarPrvd: SlideAvatar,
    public toolsPrvd: Tools,
    public authPrvd: Auth,
    public cameraPrvd: Camera,
    public chatPrvd: Chat,
    public networkPrvd: Network,
    public gpsPrvd: Gps,
    public plt: Platform,
    public modalCtrl: ModalController
  ) {
    this.keyboard.disableScroll(true);

    this.keyboard.onKeyboardShow().subscribe(res => {
      // console.log(res);
      this.chatPrvd.postBtn.setState(true);
      if (this.plt.is('ios')) {
        let footerEl = document.getElementsByClassName('chatFooter')['0'];
        let scrollEl = document.getElementsByClassName('scroll-content')['0'];
        scrollEl.style.bottom = res.keyboardHeight + 'px';
        footerEl.style.bottom = res.keyboardHeight + 'px';
      }
      setTimeout(() => {
        this.chatPrvd.mainBtn.setState('minimised');
        if (!this.chatPrvd.appendContainer.hidden) {
          this.chatPrvd.mainBtn.setState('above_append');
        }
        this.scrollToBottom();
      }, chatAnim / 2 + 1);
    }, err => {
      console.log(err);
    });

    this.keyboard.onKeyboardHide().subscribe(res => {
      // console.log(res);
      if (this.plt.is('ios')) {
        let footerEl = document.getElementsByClassName('chatFooter')['0'];
        let scrollEl = document.getElementsByClassName('scroll-content')['0'];
        footerEl.style.bottom = '0';
        scrollEl.style.bottom = '0';
      }
      setTimeout(() => {
        if (!this.chatPrvd.appendContainer.hidden) {
          this.chatPrvd.mainBtn.setState('above_append');
        }
        if (this.chatPrvd.appendContainer.hidden) {
          this.chatPrvd.mainBtn.setState('normal');
        }
        if (this.txtIn.value.trim() == '' &&
            !this.chatPrvd.appendContainer.isVisible()) {
          this.chatPrvd.postBtn.setState(false);
        }
      }, chatAnim/2 + 1);

    }, err => {
      console.log(err);
    });

    this.user = this.authPrvd.getAuthData();
    if (!this.user) this.user = {
      avatar_content_type: null,
      avatar_file_name: null,
      avatar_file_size: null,
      avatar_updated_at: null,
      avatar_url: null,
      created_at: '2017-04-22T14:59:29.921Z',
      date_of_birthday: '2004-01-01',
      email: 'olbachinskiy2@gmail.com',
      name: 'Oleksandr Bachynskyi',
      id: 55,
      invitation_sent: false,
      phone: '1492873128682',
      provider_id: null,
      provider_name: null,
      role_description: null,
      role_image_url: null,
      role_name: null,
      updated_at: '2017-04-22T14:59:29.921Z',
    }

    if (!this.user.avatar_url) {
      this.user.avatar_url = this.toolsPrvd.defaultAvatar;
    } else {
      this.user.avatar_url = this.chatPrvd.hostUrl + this.user.avatar_url;
    }
    if (!this.user.role_image_url) this.user.role_image_url = this.toolsPrvd.defaultAvatar;
    this.textStrings.sendError = 'Error sending message';
    this.textStrings.noNetwork = 'Netwrk not found';
    this.textStrings.require = 'Please fill all fields';

    let action = this.navParams.get('action');
    if (action) {
      this.chatPrvd.setState(action);
      this.isUndercover = this.undercoverPrvd.setUndercover(action == 'undercover');
    } else {
      this.isUndercover = this.undercoverPrvd.setUndercover(this.chatPrvd.getState() == 'undercover');
    }

    if (this.isUndercover) {
      this.flipHover = true;
    } else {
      this.flipHover = false;
    }

    let cameraOptions = this.cameraPrvd.getCameraOpt({ tapPhoto: false });
    this.cameraPreview.startCamera(cameraOptions).then(res => {
      console.log(res);
      if (this.isUndercover) {
        this.cameraPreview.show();
      } else {
        this.cameraPreview.hide();
      }
    }, err => {
      console.log(err);
    });

    this.changePlaceholderText();
    this.showUsers();

    this.networkParams = { post_code: this.gpsPrvd.zipCode };
    this.hostUrl = this.chatPrvd.hostUrl;

    this.gpsPrvd.changeZipCallback = this.changeZipCallback.bind(this);
  }

  private changePlaceholderText() {
    this.placeholderText = this.isUndercover ? 'On your location...' : 'Share with your area';
  }

  generateEmoticons() {
    for (let i = 0; i < this.emoticX.length; i++) {
      for (let j = 0; j < this.emoticY.length; j++) {
        this.emojis.push('0x' + this.emoticY[j].concat(this.emoticX[i]));
      }
    }
  }

  openCamera() {
    this.mainInput.setState('fadeOutfast');
    setTimeout(() => {
      this.mainInput.hide();
      this.chatPrvd.mainBtn.setState('minimisedForCamera');
      setTimeout(() => {
        this.chatPrvd.mainBtn.hide();
        this.toolsPrvd.pushPage(CameraPage);
      }, chatAnim/2);
    }, animSpeed.fadeIn/2);
  }

  toggleChatOptions() {
    this.chatOptions.setState((this.chatOptions.getState() == 'spined') ? 'default' : 'spined');
    this.bgState.setState((this.bgState.getState() == 'stretched') ? 'compressed' : 'stretched');

    if (this.bgState.getState() == 'stretched') {
      this.chatPrvd.postBtn.setState(false);
      for (let i = 0; i < this.chatBtns.state.length; i++) {
        setTimeout(() => {
          this.chatBtns.state[i] = 'btnShown';
        }, chatAnim/3 + (i*50));
      }
    } else {
      if (this.txtIn.value.trim() != '' ||
          this.cameraPrvd.takenPictures.length > 0) {
        this.chatPrvd.postBtn.setState(true);
      }
      for (let i = 0; i < this.chatBtns.state.length; i++) {
        this.chatBtns.state[i] = 'btnHidden';
      }
    }
  }

  setContentPadding(status) {
    // console.log(document.documentElement.clientHeight + '');
    this.contentPadding = status
      ? document.documentElement.clientHeight / 2 + 76 + 'px'
      : '200px';
    this.scrollToBottom();
  }

  toggleContainer(container, visibility?:string) {
    if (visibility == 'hide') {
      // this.setContentPadding(false);

      if (this.chatPrvd.appendContainer.hidden) {
        this.chatPrvd.mainBtn.setState('normal');
      } else {
        this.chatPrvd.mainBtn.setState('above_append');
      }

      container.setState('off');
      this.setContentPadding(false);
      setTimeout(() => {
        container.hide();
      }, chatAnim / 2);
    }

    if (!visibility) {
      if (container.hidden) {
        // console.log('setContentPadding', true);
        this.chatPrvd.mainBtn.setState('moved-n-scaled');

        container.show();
        container.setState('on');
        this.setContentPadding(true);

        for (let i = 0; i < this.toggContainers.length; i++) {
          if (!this.toggContainers[i].hidden &&
            container != this.toggContainers[i]) {
              this.toggContainers[i].setState('off');
            setTimeout(() => {
              this.toggContainers[i].hide();
            }, chatAnim / 2);
          }
        }
      } else {
        // console.log('setContentPadding', false);
        this.setContentPadding(false);

        if (this.chatPrvd.appendContainer.hidden) {
          this.chatPrvd.mainBtn.setState('normal');
        } else {
          this.chatPrvd.mainBtn.setState('above_append');
        }

        container.setState('off');
        setTimeout(() => {
          container.hide();
        }, chatAnim / 2);
      }
    }
  }

  insertEmoji(emoji) {
    // console.log(this.txtIn);
    // this.txtIn.nativeElement.focus();
    let emojiDecoded = String.fromCodePoint(emoji);
    this.postMessage(emojiDecoded);
    // let inputVal = this.txtIn.nativeElement.value;
    // inputVal = inputVal.split('');
    // this.getCaretPos(this.txtIn.nativeElement);
    // inputVal.splice(this.caretPos, 0, emojiDecoded);
    // this.txtIn.nativeElement.value = inputVal.join('');
    // this.txtIn.nativeElement.selectionStart = this.caretPos + emojiDecoded.length;
    // this.txtIn.nativeElement.selectionEnd = this.caretPos + emojiDecoded.length;
  }

  convertEmoji(unicode) {
    return String.fromCodePoint(unicode);
  }

  sendLockInfo (form: any) {
    if (form.invalid) {
      this.toolsPrvd.showToast(this.textStrings.require);
    } else {
      this.hideTopSlider('lock');
      this.postMessage();
    }
  }

  postMessage(emoji?: string) {
    let publicUser: boolean;
    let images = [];
    let messageParams: any;
    let message: any = {};
    let authData = this.authPrvd.getAuthData();

    if (!this.isUndercover) {
      publicUser = true;
    } else {
      publicUser = this.undercoverPrvd.profileType === 'public' ? true : false;
    }

    if (this.cameraPrvd.takenPictures) images = this.cameraPrvd.takenPictures;

    messageParams = {
      text: emoji ?  emoji : this.txtIn.value,
      user_id: authData ? authData.id : 0,
      images: emoji ? [] : images,
      undercover: this.isUndercover,
      public: publicUser,
      is_emoji: emoji ? true : false
    };

    message = Object.assign(message, messageParams);
    message.image_urls = emoji ? [] : images;
    message.isTemporary = false;
    message.temporaryFor = 0;

    if (message.text.trim() != '' || message.images.length > 0) {
      console.log(messageParams);

      let pushMessage = (data: any) => {
        message.created_at = moment();
        message.dateStr = 'a moment ago';
        message.locked = data.locked;
        message.id = data.id;
        if (!emoji) {
          this.txtIn.value = '';
          this.chatPrvd.mainBtn.setState('normal');
          this.chatPrvd.postBtn.setState(false);

          if (this.postTimer.isVisible()) {
            setTimeout(() => {
              this.postTimer.hide();
            }, chatAnim/2);
            this.postTimer.setState('slideUp');
          }

          console.log(message);

          if (this.debug.postHangTime != 0) {
            message.isTemporary = true;
            message.temporaryFor = this.debug.postHangTime;
            this.debug.postHangTime = 0;
          }
        } else {
          message.isEmoji = true;
        }
        this.postMessages.push(message);
        this.messageDateTimer.start(this.postMessages);
      }

      this.chatPrvd.sendMessage(messageParams).then(res => {
        console.log(res);

        if (this.postLockData.hint && this.postLockData.password) {
          let lockObj:any = {
            id: res.id,
            hint: this.postLockData.hint,
            password: this.postLockData.password
          }

          this.chatPrvd.lockMessage(lockObj).subscribe(lockRes => {
            console.log('[lock] res:', lockRes);
            pushMessage(lockRes);
            this.postLockData = {
              id: null,
              hint: null,
              password: null
            }
          }, lockErr => {
            console.log('[lock] err:', lockErr);
          });
        } else {
          pushMessage(res);
        }
      }).catch(err => {
        console.log(err);
        pushMessage(err);
      });
      if (!emoji) {
        this.chatPrvd.appendContainer.setState('off');
        setTimeout(() => {
          this.chatPrvd.appendContainer.hide();
        }, chatAnim/2);
        this.cameraPrvd.takenPictures = [];
      }
      this.scrollToBottom();
    }
  }

  private scrollToBottom() {
    this.content.scrollTo(0, this.content.getContentDimensions().scrollHeight, 100);
  }

  calculateInputChar(inputEl) {
    this.chatPrvd.postBtn.setState(inputEl.value.trim().length > 0 ? true : false);
  }

  getCaretPos(oField) {
    if (oField.selectionStart || oField.selectionStart == '0')
      this.caretPos = oField.selectionStart;
  }

  goToProfile(profileId?: number, profileTypePublic?: boolean) {
    if (!profileId) profileId = this.authPrvd.getAuthData().id;
    let params = {
      id: profileId,
      public: profileTypePublic
    };
    this.toolsPrvd.pushPage(ProfilePage, params);
  }

  goUndercover() {
    let network = this.chatPrvd.getNetwork();
    if (this.isUndercover && (!network || network.users_count < 10)) {
      this.toolsPrvd.showToast(this.textStrings.noNetwork);
      return;
    }

    this.isUndercover = this.undercoverPrvd.setUndercover(!this.isUndercover);
    this.flipInput();
    this.changePlaceholderText();
    this.startMessageUpdateTimer();
    setTimeout(() => {
      if (this.isUndercover) {
        // this.flipInput();
        this.chatPrvd.setState('undercover');
        this.cameraPreview.show();
        this.slideAvatarPrvd.sliderInit();
        let position = this.undercoverPrvd.profileType === 'public' ? true : false;
        this.slideAvatarPrvd.setSliderPosition(position);
      } else {
        this.chatPrvd.setState('area');
        this.cameraPreview.hide();
      }
      this.showUsers();
      this.content.resize();
    }, 100);
  }

  toggleShareSlider(mess){
    this.checkbox[mess] = !this.checkbox[mess];
  }

  changeCallback(positionLeft?: boolean) {
    this.zone.run(() => {
      this.undercoverPrvd.profileType = positionLeft ? 'public' : 'undercover';
    });
  }

  removeAppendedImage(ind) {
    this.cameraPrvd.takenPictures.splice(ind, 1);
    if (this.cameraPrvd.takenPictures.length == 0) {
      this.chatPrvd.mainBtn.setState('normal');
      this.chatPrvd.appendContainer.setState('off');
      if (this.txtIn.value.trim().length == 0)
      this.chatPrvd.postBtn.setState(false);
      setTimeout(() => {
        this.chatPrvd.appendContainer.hide();
      }, chatAnim/2);
    }
  }

  getTopSlider(container) {
    let cont;
    switch (container) {
      case 'timer':
        cont = this.postTimer;
      break;
      case 'lock':
        cont = this.postLock;
      break;
    }
    return cont;
  }

  hideTopSlider(container) {
    let cont = this.getTopSlider(container);
    if (cont.isVisible()) {
      cont.setState('slideUp');
      setTimeout(() => {
        cont.hide();
      }, chatAnim/2);
      cont.setState('slideUp');
    }
  }

  toggleTopSlider(container) {
    let cont = this.getTopSlider(container);
    if (cont.isVisible()) {
      setTimeout(() => {
        cont.hide();
      }, chatAnim/2);
      cont.setState('slideUp');
    } else {
      cont.show();
      cont.setState('slideDown');
    }
  }

  setPostTimer(total:number, time?:string) {
    if (time) {
      this.debug.postHangTime = total + time;
    } else {
      this.debug.postHangTime = total;
    }
    this.hideTopSlider('timer');
  }

  joinToNetwork() {
    this.toolsPrvd.showLoader();
    this.networkPrvd.join(this.networkParams).subscribe(res => {
      console.log(res);
      this.getUsers();
      this.toolsPrvd.hideLoader();
    }, err => {
      console.log(err);
      this.toolsPrvd.hideLoader();
    });
  }

  private getUsers() {
    this.toolsPrvd.showLoader();
    this.networkPrvd.getUsers(this.networkParams).subscribe(users => {
      console.log(users);
      if (users) {
        for (let i in users) {
          users[i].avatar_url = !users[i].avatar_url
            ? this.toolsPrvd.defaultAvatar
            : this.hostUrl + users[i].avatar_url;
          if (!users[i].role_image_url)
            users[i].role_image_url = this.toolsPrvd.defaultAvatar;
        }
        this.chatPrvd.setStorageUsers(users);
        this.chatUsers = users;
        this.startMessageUpdateTimer();
      } else {
        this.chatUsers.push(this.user);
      }

      this.toolsPrvd.hideLoader();

      console.log(this.chatUsers, this.user, this.chatUsers[this.user.is]);
    }, err => {
      console.log(err);
      this.toolsPrvd.hideLoader();
    });
  }

  private showUsers() {
    setTimeout(() => {
      this.showUserSlider = this.isUndercover;
    }, 1000);
  }


  private startMessageUpdateTimer() {
    if (this.messagesInterval) clearInterval(this.messagesInterval);
    this.showMessages();
    this.messagesInterval = setInterval(() => {
      this.showMessages();
    }, 10000);
  }

  private showMessages() {
    this.chatPrvd.getMessages(this.isUndercover).subscribe(data => {
      // console.log(data);
      if (this.postMessages.length != data.length) {
        this.postMessages = this.chatPrvd.organizeMessages(data);
        this.messageDateTimer.start(this.postMessages);
        this.scrollToBottom();
      }
    }, err => {
      console.log(err);
    });
  }

  private changeZipCallback(params?: any) {
    if (params) {
      this.isUndercover = this.undercoverPrvd.setUndercover(params.undercover);
      if (this.isUndercover) this.goUndercover();
    }
  }

  sendFeedback(messageData: any, messageId: number) {
    let feedbackData = {
      message_index: messageId,
      message_id: messageData.id,
      user: this.user
    };
    console.log('message data:', messageData);
    console.log('feedback data:', feedbackData);
    this.chatPrvd.mainBtn.setState('minimised');
    let feedbackModal = this.modalCtrl.create(FeedbackModal,
      {
        data: feedbackData,
        totalLikes: messageData.likes_count,
        likedByUser: messageData.like_by_user,
        messageText: messageData.text
      }
    );
    feedbackModal.onDidDismiss(data => {
      if (data) {
        this.postMessages[messageId] = data;
      } else {
        console.warn('[likeClose] Error, no data returned');
      }
    });
    setTimeout(() => {
      feedbackModal.present();
    }, chatAnim/2);
  }

  clearMessages() {
    this.postMessages = [];
  }

  flipInput() {
    this.flipHover = !this.flipHover;
  }

  ionViewDidEnter() {
    this.mainInput.setState('fadeIn');
    this.mainInput.show();
    this.chatPrvd.mainBtn.setState('normal');
    this.chatPrvd.mainBtn.show();

    this.slideAvatarPrvd.changeCallback = this.changeCallback.bind(this);
    if (this.isUndercover) {
      this.slideAvatarPrvd.sliderInit();
      this.slideAvatarPrvd.setSliderPosition(true);
      this.showUsers();
      this.content.resize();
    }

    this.contentBlock = document.getElementsByClassName('scroll-content')['0'];
    this.setContentPadding(false);
    this.content.scrollTo(0, this.content.getContentDimensions().scrollHeight, 100);

    this.chatPrvd.updateAppendContainer();

    this.messageDateTimer.start(this.postMessages);
    // if (this.cameraPrvd.takenPictures) {
    //   this.postMessage();
    // }
  }

  ionViewDidLoad() {
    console.log('[UNDERCOVER.ts] viewDidLoad');
    this.messageDateTimer.enableLogMessages = true;
    this.generateEmoticons();
    this.getUsers();
  }

  ionViewWillLeave() {
    console.log('[UNDERCOVER.ts] viewWillLeave');
    this.messageDateTimer.stop();
    clearInterval(this.messagesInterval);
  }
}
