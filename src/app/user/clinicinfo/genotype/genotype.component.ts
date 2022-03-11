import { Component, OnInit, LOCALE_ID, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'environments/environment';
import { TranslateService } from '@ngx-translate/core';

import { Subscription } from 'rxjs/Subscription';
import { BlobStorageService, IBlobAccessToken } from 'app/shared/services/blob-storage.service';
import { AuthService } from 'app/shared/auth/auth.service';
import { PatientService } from 'app/shared/services/patient.service';
import { ApiDx29ServerService } from 'app/shared/services/api-dx29-server.service';

import Swal from 'sweetalert2';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';

export function getCulture() {
  return sessionStorage.getItem('culture');
}

@Component({
  selector: 'app-genotype',
  templateUrl: './genotype.component.html',
  styleUrls: ['./genotype.component.scss'],
  providers: [PatientService, ApiDx29ServerService, { provide: LOCALE_ID, useFactory: getCulture }]
})

export class GenotypeComponent implements OnInit, OnDestroy {
  private subscription: Subscription = new Subscription();
  preparingFile: boolean = false;
  uploadingGenotype: boolean = false;
  accessToken: IBlobAccessToken = {
    // tslint:disable-next-line:max-line-length
    sasToken: environment.blobAccessToken.sasToken,
    blobAccountUrl: environment.blobAccessToken.blobAccountUrl,
    containerName: '',
    patientId: ''
  };

  filesVcf: any = [];
  loadedGeno: boolean = false;
  userId: string = '';
  loadedPatientId: boolean = false;
  selectedPatient: any = {};
  uploadProgress: Observable<number>;

  constructor(private blob: BlobStorageService, private authService: AuthService, private patientService: PatientService, private apiDx29ServerService: ApiDx29ServerService, public translate: TranslateService) { }

  ngOnInit(): void {

    this.initEnvironment();

    this.subscription.add(this.blob.change.subscribe(uploaded => {
      this.uploadingGenotype = false;
    }));

    //si tiene VCF
    this.subscription.add(this.blob.changeFilesExomizerBlobVcf.subscribe(vcfFilesOnBlob => {
      
      if (vcfFilesOnBlob.length > 0) {
        var filesVcf = [];
        console.log(vcfFilesOnBlob);
        var mindate = 0;
        for (var i = 0; i < vcfFilesOnBlob.length; i++) {
          if ((vcfFilesOnBlob[i].name).indexOf('.vcf') != -1) {
            var d = new Date(vcfFilesOnBlob[i].lastModified);
            if (mindate < d.getTime()) {
              mindate = d.getTime();
            }
            filesVcf.push(vcfFilesOnBlob[i]);
          }
        }
        //var filesVcf = vcfFilesOnBlob;
        for (var i = 0; i < filesVcf.length; i++) {
          filesVcf[i].nameForShow = ""
        }
        for (var i = 0; i < filesVcf.length; i++) {
          if (filesVcf[i].name.indexOf('/')) {
            var sectionsVcfBlob = filesVcf[i].name.split('/');
            filesVcf[i].nameForShow = sectionsVcfBlob[sectionsVcfBlob.length - 1]
          }
          else {
            filesVcf[i].nameForShow = filesVcf[i].name;
          }
        }
        this.filesVcf = filesVcf;
        console.log(this.filesVcf);
      } else {
        console.log('no tiene!');
      }
      this.loadedGeno = true;
    }));

  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    }

  initEnvironment(){
    this.userId = this.authService.getIdUser();
    if(this.authService.getCurrentPatient()==null){
      this.loadPatientId();
    }else{
      this.loadedPatientId = true;
      this.selectedPatient = this.authService.getCurrentPatient();
      this.getAzureBlobSasToken();
    }
  }

  loadPatientId(){
    this.loadedPatientId = false;
    this.subscription.add( this.patientService.getPatientId()
    .subscribe( (res : any) => {
      this.loadedPatientId = true;
      this.authService.setCurrentPatient(res);
      this.selectedPatient = res;
      this.getAzureBlobSasToken();
     }, (err) => {
       console.log(err);
     }));
  }

  getAzureBlobSasToken(){
    this.accessToken.containerName = this.authService.getCurrentPatient().sub.substr(1);
    this.accessToken.patientId = this.authService.getCurrentPatient().sub;

    this.subscription.add( this.apiDx29ServerService.getAzureBlobSasToken(this.accessToken.containerName)
    .subscribe( (res : any) => {
      console.log(res);
      this.accessToken.sasToken = '?'+res;
      this.blob.init(this.accessToken);
      this.blob.createContainerIfNotExists(this.accessToken, 'patientGenoFiles');
    }, (err) => {
      console.log(err);
    }));

    this.loadedGeno = false;
  }

  onFileChangePDF(event) {
    this.preparingFile = true;
    if (event.target.files && event.target.files[0]) {
      var reader = new FileReader();
      reader.readAsDataURL(event.target.files[0]); // read file as data url
      reader.onload = (event2: any) => { // called once readAsDataURL is completed
        this.preparingFile = false;
        var filename = event.target.files[0].name;
        var extension = filename.substr(filename.lastIndexOf('.'));
        var pos = (filename).lastIndexOf('.')
        pos = pos - 4;
        if (pos > 0 && extension == '.gz') {
          extension = (filename).substr(pos);
        }
        filename = filename.split(extension)[0];
        if (extension == '.vcf' || extension == '.vcf.gz') {
          filename = filename + extension;
          this.uploadingGenotype = true;
          this.uploadProgress = this.blob
            .uploadToBlobStorage(this.accessToken, event.target.files[0], filename, 'patientGenoFiles');
        } else {
          Swal.fire(this.translate.instant("patnodiagdashboard.step3-2.The file must have"), '', "warning");
        }

      }

    }
  }

  onFileDropped(event) {
    var reader = new FileReader();
    reader.readAsDataURL(event[0]); // read file as data url
    reader.onload = (event2: any) => { // called once readAsDataURL is completed
        var the_url = event2.target.result
        var extension = (event[0]).name.substr((event[0]).name.lastIndexOf('.'));
        extension = extension.toLowerCase();
        var filename = event[0].name;
        if (extension == '.vcf' || extension == '.vcf.gz') {
          filename = filename;
          this.uploadingGenotype = true;
          this.uploadProgress = this.blob
            .uploadToBlobStorage(this.accessToken, event[0], filename, 'patientGenoFiles');
        } else {
          Swal.fire(this.translate.instant("patnodiagdashboard.step3-2.The file must have"), '', "warning");
        }

    }
}

  deleteFile(file,i) {
    var filename = '';
    filename = file.nameForShow;
    
    Swal.fire({
      title: this.translate.instant("generics.Are you sure delete") + " " + filename + " ?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#33658a',
      cancelButtonColor: '#B0B6BB',
      confirmButtonText: this.translate.instant("generics.Accept"),
      cancelButtonText: this.translate.instant("generics.Cancel"),
      showLoaderOnConfirm: true,
      allowOutsideClick: false,
      reverseButtons: true
    }).then((result) => {
      if (result.value) {
        this.deleteVcfFile(file.name,i);
      }
    });

  }

  deleteVcfFile(file,i){
      var enc =false;
        for(var j = 0; j < this.filesVcf.length && !enc; j++) {
          if(this.filesVcf[j].name==file){
            enc = true;
          }
        }
        this.filesVcf.splice(i, 1);
        this.blob.deleteBlob(this.accessToken.containerName , file);
  }

}
