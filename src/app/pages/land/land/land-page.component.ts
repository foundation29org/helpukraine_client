import { Component, OnInit } from '@angular/core';
import { EventsService } from 'app/shared/services/events.service';

@Component({
    selector: 'app-land-page',
    templateUrl: './land-page.component.html',
    styleUrls: ['./land-page.component.scss'],
})

export class LandPageComponent implements OnInit {
    isApp: boolean = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1 && location.hostname != "localhost" && location.hostname != "127.0.0.1";
    iconandroid: string = 'assets/img/home/android_en.png';
    iconios: string = 'assets/img/home/ios_en.png';
    lang: string = 'en';
    constructor(private eventsService: EventsService) {
        this.lang = sessionStorage.getItem('lang');
        this.iconandroid = 'assets/img/home/android_'+this.lang+'.png';
        this.iconios = 'assets/img/home/ios_'+this.lang+'.png';
    }

    ngOnInit() {

        this.eventsService.on('changelang', function (lang) {
            this.lang = lang;
            this.iconandroid = 'assets/img/home/android_'+this.lang+'.png';
            this.iconios = 'assets/img/home/ios_'+this.lang+'.png';
        }.bind(this));
    
      }

    openWeb(){
        if(this.lang=='es'){
            window.open('https://www.foundation29.org', '_blank');
        }else{
            window.open('https://www.foundation29.org/en/', '_blank');
        }
    }
}
