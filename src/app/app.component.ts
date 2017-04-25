import { Component } from '@angular/core';
import { Platform, Events, App } from 'ionic-angular';
import { Sim } from '@ionic-native/sim';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

// Pages
import { LogInPage } from '../pages/log-in/log-in';
import { NetworkFindPage } from '../pages/network-find/network-find';
import { UndercoverCharacterPage } from '../pages/undercover-character/undercover-character';
// import { SignUpFacebookPage } from '../pages/sign-up-facebook/sign-up-facebook';
import { ChatPage } from '../pages/chat/chat';
// import { HomePage } from '../pages/home/home';
// import { ProfilePage } from '../pages/profile/profile';
// import { ProfileSettingPage } from '../pages/profile-setting/profile-setting';
// import { NetworkNoPage } from '../pages/network-no/network-no';
// import { NetworkPage } from '../pages/network/network';
// import { CameraPage } from '../pages/camera/camera';
// import { SignUpConfirmPage } from '../pages/sign-up-confirm/sign-up-confirm';

// Providers
import { Auth } from '../providers/auth';
import { LocalStorage } from '../providers/local-storage';
import { Tools } from '../providers/tools';
import { UndercoverProvider } from '../providers/undercover';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage;

  constructor(
    public platform: Platform,
    public app: App,
    public events: Events,
    private authPrvd: Auth,
    private localStoragePrvd: LocalStorage,
    private toolsPrvd: Tools,
    private undercoverPrvd: UndercoverProvider,
    public statusBar: StatusBar,
    public splashScreen: SplashScreen,
    private sim: Sim
  ) {
    platform.registerBackButtonAction(() => {
      this.toolsPrvd.doBackButton();
      return false;
    });

    platform.ready().then(() => {
      this.getLogin();
      this.getSimInfo();

      this.statusBar.styleDefault();
    });

    this.app.viewDidEnter.subscribe((view) => {
      this.toolsPrvd.subscribeViewDidEnter(view);
    });
  }

  private getLogin() {
    let authType = this.authPrvd.getAuthType();
    let authData = this.authPrvd.getAuthData();

    if (authType && authData) {
      switch (authType) {
        case 'facebook':
          this.authPrvd.getFbLoginStatus().then(data => {
            this.rootPage = data.status && data.status == 'connected' ?
              this.undercoverPrvd.getCharacterPerson(UndercoverCharacterPage, NetworkFindPage) :
              LogInPage;

            this.splashScreen.hide();
          });
          break;
        case 'email':
          let fbConnected = this.authPrvd.getFbConnected();
          this.rootPage = fbConnected ?
            this.undercoverPrvd.getCharacterPerson(UndercoverCharacterPage, NetworkFindPage) :
            LogInPage;

          this.splashScreen.hide();
          break;
      }
    } else {
      this.rootPage = LogInPage;
      // this.rootPage = NetworkFindPage;
      // this.rootPage = ProfilePage;
      // this.rootPage = ChatPage;
      // this.rootPage = CameraPage;
      // this.rootPage = UndercoverCharacterPage;
      // this.rootPage = SignUpConfirmPage;
      // this.rootPage = SignUpFacebookPage;
    }
  }

  // private getChatPage(): any {
  //   let person = this.undercoverPrvd.getPerson();
  //   let result = !person ? UndercoverCharacterPage : NetworkFindPage;
  //   return result;
  // }

  private getSimInfo() {
    this.sim.getSimInfo().then(
      (info) => {
        console.log('Sim info: ', info);
        this.localStoragePrvd.set('country_code', info.countryCode);
      },
      (err) => console.log('Unable to get sim info: ', err)
    );
  }
}
