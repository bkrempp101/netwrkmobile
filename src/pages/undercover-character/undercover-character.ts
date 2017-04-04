import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

import { Slides } from 'ionic-angular';

@Component({
  selector: 'page-undercover-character',
  templateUrl: 'undercover-character.html'
})
export class UndercoverCharacterPage {
  testSlides: string[] = [];
  @ViewChild(Slides) slides: Slides;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams
  ) {

  }

  ionViewDidLoad() {
    console.log(this.slides);
    // this.slides.slideTo(2, 500);
    this.slides.ionSlideWillChange.subscribe(() => {
      console.log(this.slides);
      console.log(document.getElementsByClassName('swiper-slide-next'));
      let activeSlide = document.getElementsByClassName('swiper-slide-next')[0];
      activeSlide.className += " active-character";
    });

    this.slides.initialSlide = 2;

    console.log('ionViewDidLoad UndercoverCharacterPage');
  }

}