import { Component, OnInit, LOCALE_ID, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'environments/environment';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { TranslateService } from '@ngx-translate/core';
import { NgbModal, NgbModalRef, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';

import { Subscription } from 'rxjs/Subscription';
import { BlobStorageService, IBlobAccessToken } from 'app/shared/services/blob-storage.service';
import { AuthService } from 'app/shared/auth/auth.service';
import { PatientService } from 'app/shared/services/patient.service';
import { ApiDx29ServerService } from 'app/shared/services/api-dx29-server.service';
import { Apif29BioService } from 'app/shared/services/api-f29bio.service';
import { SearchService } from 'app/shared/services/search.service';
import { SortService } from 'app/shared/services/sort.service';
import { DateService } from 'app/shared/services/date.service';
import { HighlightSearch } from 'app/shared/services/search-filter-highlight.service';

import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';

export function getCulture() {
  return sessionStorage.getItem('culture');
}

declare var JSZipUtils: any;
declare var Docxgen: any;

@Component({
  selector: 'app-medical-records',
  templateUrl: './medical-records.component.html',
  styleUrls: ['./medical-records.component.scss'],
  providers: [PatientService, ApiDx29ServerService, { provide: LOCALE_ID, useFactory: getCulture }, Apif29BioService]
})
export class MedicalRecordsComponent implements OnInit, OnDestroy {

  private subscription: Subscription = new Subscription();
  preparingFile: boolean = false;
  preparingFileEmergency: boolean = false;
  uploadingGenotype: boolean = false;
  uploadingEmergency: boolean = false;
  accessToken: IBlobAccessToken = {
    // tslint:disable-next-line:max-line-length
    sasToken: environment.blobAccessToken.sasToken,
    blobAccountUrl: environment.blobAccessToken.blobAccountUrl,
    containerName: '',
    patientId: ''
  };

  otherGeneFiles: any = [];
  emergencyFiles: any = [];
  filesNcr: any = [];
  loadedGeno: boolean = false;
  userId: string = '';
  loadedPatientId: boolean = false;
  selectedPatient: any = {};
  uploadProgress: Observable<number>;
  uploadProgress2: Observable<number>;
  langDetected: string = '';
  lang: string = 'en';
  resTextAnalyticsSegments = [];
  temporalSymptoms: any = [];
  resultTextNcr: string = '';
  resultTextNcrCopy: string = '';
  step: string = '0';
  ncrResultView: boolean = false;
  selectedInfoSymptomIndex: number = -1;
  modalReference: NgbModalRef;
  phenotype: any = {};
  phenotypeCopy: any = {};
  sendingSymptoms: boolean = false;
  private msgDataSavedFail: string;
  showButtonScroll: boolean = false;
  extractingData: boolean = false;
  callingTextAnalytics: boolean = false;
  nameTitle: string = '';
  submitted = false;
  saving: boolean = false;

  documentForm: FormGroup;
  dataFile: any = {};
  typedocument: string = '';

  loadedDocs: boolean = false;
  docs: any = [];
  actualDoc: any = {};
  simplename: string = '';

  constructor(private http: HttpClient, private blob: BlobStorageService, private authService: AuthService, private patientService: PatientService, private apiDx29ServerService: ApiDx29ServerService, public translate: TranslateService, public toastr: ToastrService, private apif29BioService: Apif29BioService, private searchService: SearchService, private sortService: SortService, private modalService: NgbModal, private authGuard: AuthGuard, private highlightSearch: HighlightSearch, private formBuilder: FormBuilder, private dateService: DateService) {
    $.getScript("./assets/js/docs/jszip-utils.js").done(function (script, textStatus) {
      //console.log("finished loading and running jszip-utils.js. with a status of" + textStatus);
    });

    $.getScript("./assets/js/docs/docxtemplater.v2.1.5.js").done(function (script, textStatus) {
      //console.log("finished loading and running docxtemplater.js. with a status of" + textStatus);
    });

    this.lang = sessionStorage.getItem('lang');
    this.loadTranslations();
  }

  loadTranslations(){
    this.translate.get('generics.Data saved fail').subscribe((res: string) => {
      this.msgDataSavedFail=res;
    });
  }

  ngOnInit(): void {

    this.initEnvironment();

    this.subscription.add(this.blob.change.subscribe(uploaded => {
      this.uploadingGenotype = false;
      this.uploadingEmergency = false;
      this.getDocs();
    }));

    //si tiene VCF
    this.subscription.add(this.blob.changeFilesExomizerBlobVcf.subscribe(vcfFilesOnBlob => {
      if (vcfFilesOnBlob.length > 0) {
        var otherGeneFiles = [];
        var emergencyFiles = [];
        var filesNcr = [];
        for (var i = 0; i < vcfFilesOnBlob.length; i++) {
          if (vcfFilesOnBlob[i].name.indexOf('raitofile/') != -1) {
            var name = vcfFilesOnBlob[i].name.substr(vcfFilesOnBlob[i].name.lastIndexOf('/') + 1)
            vcfFilesOnBlob[i].simplename = name;
            vcfFilesOnBlob[i].contentLength = this.formatBytes(vcfFilesOnBlob[i].contentLength);
            if ((vcfFilesOnBlob[i].name).indexOf('textanaresult.json') == -1) {
              if (vcfFilesOnBlob[i].name.indexOf('raitofile/emergency/') != -1) {
                emergencyFiles.push(vcfFilesOnBlob[i])
              }else{
                otherGeneFiles.push(vcfFilesOnBlob[i])
              }
              
            } else {
              filesNcr.push(vcfFilesOnBlob[i]);
            }

          }
        }
        this.emergencyFiles = emergencyFiles;
        this.otherGeneFiles = otherGeneFiles;
        console.log(this.emergencyFiles);
        this.filesNcr = filesNcr;
        this.testResultsAnalytics();
      } else {
        console.log('no tiene!');
      }
      this.loadedGeno = true;
    }));

    this.subscription.add(this.blob.changeNcrFilesPatientBlob.subscribe(filesNcr => {
      if (filesNcr.length > 0) {
        this.filesNcr = filesNcr;
        this.testResultsAnalytics();
      } else {
        console.log('no tiene ncr!');
        this.filesNcr = [];
      }
    }));

  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    }

  testResultsAnalytics() {
    for (var i = 0; i < this.otherGeneFiles.length; i++) {
      var enc = false;
      for (var j = 0; j < this.filesNcr.length && !enc; j++) {
        var urlorigin = this.otherGeneFiles[i].name.substr(0, this.otherGeneFiles[i].name.lastIndexOf('/') + 1)
        var urlncr = this.filesNcr[j].name.substr(0, this.filesNcr[j].name.lastIndexOf('/') + 1)
        if (urlorigin == urlncr) {
          this.otherGeneFiles[i].hasResults = true;
          enc = true;
        }
      }
      if(!this.otherGeneFiles[i].hasResults){
        this.extractData(this.otherGeneFiles[i].name, this.otherGeneFiles[i].contentSettings.contentType);
      }

    }

    for (var i = 0; i < this.emergencyFiles.length; i++) {
      var enc = false;
      for (var j = 0; j < this.filesNcr.length && !enc; j++) {
        var urlorigin = this.emergencyFiles[i].name.substr(0, this.emergencyFiles[i].name.lastIndexOf('/') + 1)
        var urlncr = this.filesNcr[j].name.substr(0, this.filesNcr[j].name.lastIndexOf('/') + 1)
        if (urlorigin == urlncr) {
          this.emergencyFiles[i].hasResults = true;
          enc = true;
        }
      }
      if(!this.emergencyFiles[i].hasResults){
        this.extractData(this.emergencyFiles[i].name, this.emergencyFiles[i].contentSettings.contentType);
      }
    }
  }

  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  initEnvironment() {
    this.userId = this.authService.getIdUser();
    if (this.authService.getCurrentPatient() == null) {
      this.loadPatientId();
    } else {
      this.loadedPatientId = true;
      this.selectedPatient = this.authService.getCurrentPatient();
      this.getAzureBlobSasToken();
    }
  }

  loadPatientId() {
    this.loadedPatientId = false;
    this.subscription.add(this.patientService.getPatientId()
      .subscribe((res: any) => {
        this.loadedPatientId = true;
        this.authService.setCurrentPatient(res);
        this.selectedPatient = res;
        this.getAzureBlobSasToken();
      }, (err) => {
        console.log(err);
      }));
  }

  getAzureBlobSasToken() {
    this.getDocs();
    this.loadSymptoms();
    this.accessToken.containerName = this.authService.getCurrentPatient().sub.substr(1);
    this.accessToken.patientId = this.authService.getCurrentPatient().sub;

    this.subscription.add(this.apiDx29ServerService.getAzureBlobSasToken(this.accessToken.containerName)
      .subscribe((res: any) => {
        this.accessToken.sasToken = '?' + res;
        this.blob.init(this.accessToken);
        this.blob.createContainerIfNotExists(this.accessToken, 'patientGenoFiles');
      }, (err) => {
        console.log(err);
      }));

    this.loadedGeno = false;
  }

  loadSymptoms(){
    var para= this.authService.getCurrentPatient();
    //cargar el fenotipo del usuario
    this.subscription.add( this.apiDx29ServerService.getSymptoms(para.sub)
    .subscribe( (res : any) => {
      if(res.message){
        //no tiene fenotipo
      }else{
        if(res.phenotype.data.length>0){
          res.phenotype.data.sort(this.sortService.GetSortOrder("name"));
          this.phenotype = res.phenotype;
          this.phenotypeCopy = JSON.parse(JSON.stringify(res.phenotype));
        }else{
          //no tiene fenotipo
          this.phenotype = res.phenotype;
          this.phenotypeCopy = JSON.parse(JSON.stringify(res.phenotype));
        }
      }
     }, (err) => {
       console.log(err);
     }));
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
        //event.target.response.content
        if (extension == '.jpg' || extension == '.png' || extension == '.gif' || extension == '.tiff' || extension == '.tif' || extension == '.bmp' || extension == '.dib' || extension == '.bpg' || extension == '.psd' || extension == '.jpeg' || extension == '.jpe' || extension == '.jfif' || event.target.files[0].type == 'application/pdf' || extension == '.docx' || event.target.files[0].type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          var uniqueFileName = this.getUniqueFileName();
          filename = 'raitofile/' + uniqueFileName + '/' + filename + extension;
          this.uploadingGenotype = true;
          this.uploadProgress = this.blob
            .uploadToBlobStorage(this.accessToken, event.target.files[0], filename, 'patientGenoFiles');
        } else {
          Swal.fire(this.translate.instant("dashboardpatient.error extension"), '', "warning");
        }

      }

    }
  }

  onFileChangeStep1(event) {
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
        //event.target.response.content
        if (extension == '.jpg' || extension == '.png' || extension == '.gif' || extension == '.tiff' || extension == '.tif' || extension == '.bmp' || extension == '.dib' || extension == '.bpg' || extension == '.psd' || extension == '.jpeg' || extension == '.jpe' || extension == '.jfif' || event.target.files[0].type == 'application/pdf' || extension == '.docx' || event.target.files[0].type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          var uniqueFileName = this.getUniqueFileName();
          if(this.typedocument=='general'){
            filename = 'raitofile/' + uniqueFileName + '/' + filename + extension;
          }else{
            filename = 'raitofile/emergency/' + uniqueFileName + '/' + filename + extension;
          }
          this.dataFile = {event:event.target.files[0], url: filename, name: event.target.files[0].name}
          
        } else {
          Swal.fire(this.translate.instant("dashboardpatient.error extension"), '', "warning");
        }

      }

    }
  }

  onFileChangeStep2(){
    if(this.typedocument=='general'){
      this.uploadingGenotype = true;
      this.uploadProgress = this.blob
        .uploadToBlobStorage(this.accessToken, this.dataFile.event, this.dataFile.url, 'patientGenoFiles');
        if (this.modalReference != undefined) {
          this.modalReference.close();
          this.modalReference = undefined;
          this.dataFile = {};
        }
    }else{
      this.uploadingEmergency = true;
          this.uploadProgress2 = this.blob
            .uploadToBlobStorage(this.accessToken, this.dataFile.event, this.dataFile.url, 'patientGenoFiles');
            if (this.modalReference != undefined) {
              this.modalReference.close();
              this.modalReference = undefined;
            }
            this.dataFile = {};
    }
    
  }

  

  onFileEmergencyChange(event) {
    this.preparingFileEmergency = true;
    if (event.target.files && event.target.files[0]) {
      var reader = new FileReader();
      reader.readAsDataURL(event.target.files[0]); // read file as data url
      reader.onload = (event2: any) => { // called once readAsDataURL is completed
        this.preparingFileEmergency = false;
        var filename = event.target.files[0].name;
        var extension = filename.substr(filename.lastIndexOf('.'));
        var pos = (filename).lastIndexOf('.')
        pos = pos - 4;
        if (pos > 0 && extension == '.gz') {
          extension = (filename).substr(pos);
        }
        filename = filename.split(extension)[0];
        //event.target.response.content
        if (extension == '.jpg' || extension == '.png' || extension == '.gif' || extension == '.tiff' || extension == '.tif' || extension == '.bmp' || extension == '.dib' || extension == '.bpg' || extension == '.psd' || extension == '.jpeg' || extension == '.jpe' || extension == '.jfif' || event.target.files[0].type == 'application/pdf' || extension == '.docx' || event.target.files[0].type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          var uniqueFileName = this.getUniqueFileName();
          filename = 'raitofile/emergency/' + uniqueFileName + '/' + filename + extension;
          this.uploadingEmergency = true;
          this.uploadProgress2 = this.blob
            .uploadToBlobStorage(this.accessToken, event.target.files[0], filename, 'patientGenoFiles');
        } else {
          Swal.fire(this.translate.instant("dashboardpatient.error extension"), '', "warning");
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
      if (extension == '.jpg' || extension == '.png' || extension == '.gif' || extension == '.tiff' || extension == '.tif' || extension == '.bmp' || extension == '.dib' || extension == '.bpg' || extension == '.psd' || extension == '.jpeg' || extension == '.jpe' || extension == '.jfif' || event.target.files[0].type == 'application/pdf' || extension == '.docx' || event.target.files[0].type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        var uniqueFileName = this.getUniqueFileName();
        filename = 'raitofile/' + uniqueFileName + '/' + filename;
        this.uploadingGenotype = true;
        this.uploadProgress = this.blob
          .uploadToBlobStorage(this.accessToken, event[0], filename, 'patientGenoFiles');
      } else {
        Swal.fire(this.translate.instant("dashboardpatient.error extension"), '', "warning");
      }

    }
  }

  getUniqueFileName() {
    var now = new Date();
    var y = now.getFullYear();
    var m = now.getMonth() + 1;
    var d = now.getDate();
    var h = now.getHours();
    var mm = now.getMinutes();
    var ss = now.getSeconds();
    var ff = Math.round(now.getMilliseconds() / 10);
    var date = '' + y.toString().substr(-2) + (m < 10 ? '0' : '') + m + (d < 10 ? '0' : '') + d + (h < 10 ? '0' : '') + h + (mm < 10 ? '0' : '') + mm + (ss < 10 ? '0' : '') + ss + (ff < 10 ? '0' : '') + ff;
    var randomString = this.makeid(8);
    var name = date + randomString;
    var url = y.toString().substr(-2) + '/' + (m < 10 ? '0' : '') + m + '/' + (d < 10 ? '0' : '') + d + '/' + name;
    return url;
  }

  makeid(length) {
    var result = '';
    var characters = '0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += Math.floor(Math.random() * charactersLength);
    }
    return result;
  }

  deleteFile(file, i, option) {
    var filename = '';
    filename = file.simplename;
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
        if(option=='emergency'){
          this.deleteEmergencyFile(file.name, i);
        }else{
          this.deleteOtherFile(file.name, i);
        }
        this.deleteReferenceFile(file.name);
      }
    });

  }

  deleteReferenceFile(url){
    console.log(this.docs);
    var documentId=null;
    var enc = false;
    for (var i = 0; i < this.docs.length && !enc; i++) {
      if(this.docs[i].url==url){
        documentId = this.docs[i]._id;
        enc = true;
      }
    }
    if(enc){
      this.subscription.add( this.http.delete(environment.api+'/api/document/'+documentId)
      .subscribe( (res : any) => {
        console.log(res);
        this.getDocs();
       }, (err) => {
         console.log(err);
         this.saving = false;
         if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
           this.authGuard.testtoken();
         }else{
         }
       }));
    }
    
  }

  deleteOtherFile(file, i) {
    var enc = false;
    var file2 = '';
    for (var j = 0; j < this.otherGeneFiles.length && !enc; j++) {
      file2 = this.otherGeneFiles[j].name.substr(0, this.otherGeneFiles[j].name.lastIndexOf('/') + 1);
      file2 = file2+'textanaresult.json';
      if (this.otherGeneFiles[j].name == file) {
        enc = true;
      }
    }
    this.otherGeneFiles.splice(i, 1);
    this.blob.deleteBlob(this.accessToken.containerName, file);
    if(enc){
      this.blob.deleteBlob(this.accessToken.containerName, file2);
    }
  }

  deleteEmergencyFile(file, i) {
    var enc = false;
    var file2 = '';
    for (var j = 0; j < this.emergencyFiles.length && !enc; j++) {
      file2 = this.emergencyFiles[j].name.substr(0, this.emergencyFiles[j].name.lastIndexOf('/') + 1);
      file2 = file2+'textanaresult.json';
      if (this.emergencyFiles[j].name == file) {
        enc = true;
      }
    }
    this.emergencyFiles.splice(i, 1);
    this.blob.deleteBlob(this.accessToken.containerName, file);
    if(enc){
      this.blob.deleteBlob(this.accessToken.containerName, file2);
    }
  }

  extractData(blobName, contentType) {
    this.extractingData = true;
    var url = environment.blobAccessToken.blobAccountUrl + this.accessToken.containerName + '/' + blobName + this.accessToken.sasToken;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'blob';
    xhr.onload = function (oEvent) {
      var myBlob = xhr.response; // Note: not oReq.responseText
      const file3 = new File([myBlob], blobName, { type: contentType, lastModified: new Date().getTime() });
      if (contentType != "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        this.callParser(file3, blobName);
      } else {
        //obtener texto del word
        let reader = new FileReader();
        reader.readAsDataURL(file3); // converts the blob to base64 and calls onload
        reader.onload = function () {
          this.getTextFromDocx(reader.result, blobName);
        }.bind(this);
      }

    }.bind(this);
    xhr.send();
  }

  getTextFromDocx(data, blobName) {
    this.loadFile(data, function (err, content) {
      if (err) { console.log(err); };
      var doc = new Docxgen(content);
      var text = doc.getFullText();
      this.startExtractor(text, blobName);
    }.bind(this))
  }

  callParser(file, blobName) {

    var oReq = new XMLHttpRequest();
    var lang = this.authService.getLang();
    var self = this;

    oReq.open("PUT", environment.f29api + '/api/Document/Parse?Timeout=5000&language=' + lang + '&Strategy=OcrOnly', true);

    oReq.onload = function (oEvent) {
      // Uploaded.
      let file2 = oEvent.target;
      var target: any = {};
      target = file2;
      //target--> status, strategy, content
      var text = '';
      if (target.response.content == undefined) {
        text = '';
      } else {
        text = target.response.content
        text = text.split("\n").join(" ");
      }
      this.startExtractor(text, blobName);

    }.bind(this);
    oReq.send(file);
    const rt = "json";
    oReq.responseType = rt;
  }

  loadFile(url, callback) {
    JSZipUtils.getBinaryContent(url, callback);
  }

  startExtractor(text, blobName) {
    if (text.length < 5) {
      Swal.fire('', this.translate.instant("land.placeholderError"), "warning");
    } else {
      var actualDate = Date.now();
      this.saveResultsToBlob(text, [], actualDate, blobName);
    }
  }

  saveResultsToBlob(medicalText, data, actualDate, blobName) {
    var infoNcrToSave = { medicalText: medicalText, data: data, date: actualDate, blobName: blobName };
    var url = blobName.substr(0, blobName.lastIndexOf('/') + 1)
    var str = JSON.stringify(infoNcrToSave);
    var fileNameNcr = url + 'textanaresult.json';
    var file = new File([str], fileNameNcr, { type: 'application/json' });
    this.blob.uploadToBlobStorage(this.accessToken, file, fileNameNcr, 'ncrInfofile');
    this.extractingData = false;
  }

  addTemporalSymptom(symptom, inputType) {
    var foundElement = this.searchService.search(this.temporalSymptoms, 'id', symptom.id);
    if (!foundElement) {
      this.temporalSymptoms.push({ id: symptom.id, name: symptom.name, new: true, checked: null, percentile: -1, inputType: inputType, importance: '1', polarity: '0', onset: null, similarity: symptom.similarity, positions: symptom.positions, text: symptom.text });
      this.temporalSymptoms.sort(this.sortService.GetSortOrder("name"));
      return true;
    } else {
      //buscar el sintoma, mirar si tiene mejor prababilidad, y meter la nueva aparicion en posiciones
      var enc = false;
      for (var z = 0; z < this.temporalSymptoms.length && !enc; z++) {
        if (this.temporalSymptoms[z].id == symptom.id && this.temporalSymptoms[z].inputType != "manual") {
          if (this.temporalSymptoms[z].inputType == "textAnalytics") {
            this.temporalSymptoms[z].text.push(symptom.text);
          } else {
            if (this.temporalSymptoms[z].similarity < symptom.similarity) {
              this.temporalSymptoms[z].similarity = symptom.similarity;
            }
            this.temporalSymptoms[z].positions.push(symptom.positions[0]);
          }

          enc = true;
        }
      }
      return false;
    }
  }

  callGetInfoTempSymptomsJSON(hposStrins) {
    var lang = this.lang;
    this.subscription.add(this.apif29BioService.getInfoOfSymptoms(lang, hposStrins)
      .subscribe((res: any) => {
        var tamano = Object.keys(res).length;
        if (tamano > 0) {
          for (var i in res) {
            for (var j = 0; j < this.temporalSymptoms.length; j++) {
              if (res[i].id == this.temporalSymptoms[j].id) {
                this.temporalSymptoms[j].name = res[i].name;
                this.temporalSymptoms[j].def = res[i].desc;
                this.temporalSymptoms[j].synonyms = res[i].synonyms;
                this.temporalSymptoms[j].comment = res[i].comment;
                if (this.temporalSymptoms[j].importance == undefined) {
                  this.temporalSymptoms[j].importance = 1;
                }
              }
            }
          }
          this.temporalSymptoms.sort(this.sortService.GetSortOrder("name"));
        }
      }, (err) => {
        console.log(err);
      }));
  }

  openResults(name, contentviewDoc, nameTitle) {
    this.nameTitle = nameTitle;
    var url = name.substr(0, name.lastIndexOf('/') + 1)
    var fileNameNcr = url + 'textanaresult.json';
    var url2 = this.accessToken.blobAccountUrl + this.accessToken.containerName + '/' + fileNameNcr + this.accessToken.sasToken;
    this.subscription.add(this.http.get(this.accessToken.blobAccountUrl + this.accessToken.containerName + '/' + fileNameNcr + this.accessToken.sasToken)
      .subscribe((res: any) => {
        this.resultTextNcr = res.medicalText;
        this.resultTextNcrCopy = res.medicalText;
        let ngbModalOptions: NgbModalOptions = {
          keyboard: false,
          windowClass: 'ModalClass-sm'// xl, lg, sm
        };
        this.modalReference = this.modalService.open(contentviewDoc, ngbModalOptions);
      }, (err) => {
        console.log(err);
      }));

  }

  back(index) {
    this.step = index;
  }

  showMoreInfoSymptomPopup(symptomIndex, contentInfoSymptomNcr) {
    this.ncrResultView = false;
    this.selectedInfoSymptomIndex = symptomIndex;
    let ngbModalOptions: NgbModalOptions = {
      keyboard: false,
      windowClass: 'ModalClass-sm'// xl, lg, sm
    };
    this.modalReference = this.modalService.open(contentInfoSymptomNcr, ngbModalOptions);
  }

  changeStateSymptom(index) {
    this.temporalSymptoms[index].checked = !this.temporalSymptoms[index].checked;
  }

  closeModal() {
    document.getElementsByClassName("ModalClass-sm")[0].removeEventListener("scroll", this.myFunction);
    if (this.modalReference != undefined) {
      this.modalReference.close();
      this.modalReference = undefined;
    }
  }

  myFunction() {
    document.getElementsByClassName("ModalClass-sm")[0]
      .addEventListener('scroll', function () {
        var height = document.getElementById('idBody').offsetHeight;
        var docHeight = $(document).height();
        var sizeele = $(".ModalClass-sm").scrollTop();
        if (height > docHeight) {
          if (sizeele <= (docHeight / 2)) {
            this.showButtonScroll = false;
          } else {
            this.showButtonScroll = true;
          }
        } else {
          this.showButtonScroll = false;
        }
      }.bind(this));
  }

  saveSymptomsToDb(){
    if(this.authGuard.testtoken()){
      this.sendingSymptoms = true;
  
      var phenotoSave = JSON.parse(JSON.stringify(this.phenotype));
      phenotoSave.data = [];

      
      for (var i = 0; i <  this.temporalSymptoms.length; i++) {
        var foundElement = this.searchService.search(this.phenotype.data, 'id', this.temporalSymptoms[i].id);
        if (!foundElement && this.temporalSymptoms[i].checked) {
          this.phenotype.data.push(this.temporalSymptoms[i]);
        }else if(foundElement && !this.temporalSymptoms[i].checked){
          var foundElementIndex = this.searchService.searchIndex(this.phenotype.data, 'id', this.temporalSymptoms[i].id);
          this.phenotype.data.splice(foundElementIndex, 1);
        }
      }
      


      for (var i = 0; i <  this.phenotype.data.length; i++) {
          if(this.phenotype.data[i].inputType == undefined){
            phenotoSave.data.push({id: this.phenotype.data[i].id,name: this.phenotype.data[i].name, inputType: 'unknown', importance: '1', polarity: '0', onset: null});
          }else{
            phenotoSave.data.push({id: this.phenotype.data[i].id,name: this.phenotype.data[i].name, inputType: this.phenotype.data[i].inputType, importance: '1', polarity: '0', onset: null});
          }
      }
      this.phenotype = JSON.parse(JSON.stringify(phenotoSave));
      this.phenotype.date = Date.now();
      if(this.phenotype._id==null){
        this.subscription.add( this.http.post(environment.api+'/api/phenotypes/'+this.authService.getCurrentPatient().sub, this.phenotype)
        .subscribe( (res : any) => {
          this.sendingSymptoms = false;
          this.back('0');
         }, (err) => {
           console.log(err);
           this.sendingSymptoms = false;
           if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
             this.authGuard.testtoken();
           }else{
             this.toastr.error('', this.msgDataSavedFail);
           }
         }));
      }else{
        this.subscription.add( this.http.put(environment.api+'/api/phenotypes/'+this.phenotype._id, this.phenotype)
        .subscribe( (res : any) => {
          this.sendingSymptoms = false;
          this.back('0');
         }, (err) => {
           console.log(err.error);
           this.sendingSymptoms = false;
           if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
             this.authGuard.testtoken();
           }else{
             this.toastr.error('', this.msgDataSavedFail);
           }
         }));
      }
    }
  }

  showCompleteNcrResultView(symptom, method) {
    this.ncrResultView = !this.ncrResultView;
    if (symptom != null) {
        if(method=='ncr'){
            //this.markAllText(symptom)
        }else if(method=='textAnalytics'){
            this.markAllTextAnalytics(symptom)
        }
        
    }
}

markAllTextAnalytics(symptom) {
  this.resultTextNcrCopy = this.resultTextNcr;
  var text = symptom.text[0].text;
  if (this.lang != 'en') {//if (this.langDetected != 'en') {
      text = symptom.text[0].text;
      var hpo = symptom;
      var words = [];
      for (var j = 0; j < hpo.text.length; j++) {
          if(hpo.text[j].positions!=undefined){
              var value = text.substring(hpo.text[j].positions[0], hpo.text[j].positions[1]);
              words.push({ args: value })
          }
          
      }
      this.resultTextNcrCopy = this.highlightSearch.transformAll(this.resultTextNcr, words);
  } else {
      var hpo = symptom;
      var words = [];
      for (var j = 0; j < hpo.text.length; j++) {
          if(hpo.text[j].positions!=undefined){
              var value = text.substring(hpo.text[j].positions[0], hpo.text[j].positions[1]);
              words.push({ args: value })
          }
          
      }
      this.resultTextNcrCopy = this.highlightSearch.transformAll(this.resultTextNcr, words);
  }
  this.showScrollButton();
}

showScrollButton() {
  setTimeout(() => {
      var el = document.getElementsByClassName("actualPosition")[0];
      if (el != undefined) {
          el.scrollIntoView(true);
          var height = document.getElementById('idBody').offsetHeight;
          var docHeight = $(document).height();
          if (height > docHeight) {
              this.showButtonScroll = true;
              this.myFunction();
          } else {
              this.showButtonScroll = false;
          }
      }
  }, 100);
}

newDoc(){
  this.step = '2';
}

shareFile(){
  this.step = 'share'
}

getLiteral(literal) {
  return this.translate.instant(literal);
}

get f() { return this.documentForm.controls; }

createDocument(contentDocument, typedocument){
  this.typedocument = typedocument;
  this.documentForm = this.formBuilder.group({
    name: ['', Validators.required],
    dateDoc: ['', Validators.required],
    url:'',
    description: []
});

  let ngbModalOptions: NgbModalOptions = {
    keyboard: false,
    windowClass: 'ModalClass-sm'// xl, lg, sm
  };
  this.modalReference = this.modalService.open(contentDocument, ngbModalOptions);
}

saveData(){
  this.submitted = true;
  if (this.documentForm.invalid) {
      return;
  }
  
  if (this.documentForm.value.dateDoc != null) {
    this.documentForm.value.dateDoc = this.dateService.transformDate(this.documentForm.value.dateDoc);
  }

  
  if(this.authGuard.testtoken()){
    this.saving = true;
    this.documentForm.value.url=this.dataFile.url;
    console.log(this.documentForm.value);
    this.subscription.add( this.http.post(environment.api+'/api/document/'+this.authService.getCurrentPatient().sub, this.documentForm.value)
      .subscribe( (res : any) => {
        this.saving = false;
        this.submitted = false;
        this.documentForm.reset();
        this.onFileChangeStep2();
       }, (err) => {
         console.log(err);
         this.saving = false;
         if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
           this.authGuard.testtoken();
         }else{
         }
       }));
  }
}

editDocument(file, updateDocument){
  var enc = false;
  for (var i = 0; i < this.docs.length && !enc; i++) {
    if(this.docs[i].url==file.name){
      this.actualDoc = this.docs[i];
      this.simplename = file.simplename;
      enc = true;
    }
  }
  if(enc){
    
    this.documentForm = this.formBuilder.group({
      name: [this.actualDoc.name, Validators.required],
      dateDoc: [this.dateService.transformDate(this.actualDoc.dateDoc), Validators.required],
      url:this.actualDoc.url,
      description: [this.actualDoc.description]
  });
    let ngbModalOptions: NgbModalOptions = {
      keyboard: false,
      windowClass: 'ModalClass-sm'// xl, lg, sm
    };
    this.modalReference = this.modalService.open(updateDocument, ngbModalOptions);
  }
}

updateData(){
  this.submitted = true;
  if (this.documentForm.invalid) {
      return;
  }
  
  if (this.documentForm.value.dateDoc != null) {
    this.documentForm.value.dateDoc = this.dateService.transformDate(this.documentForm.value.dateDoc);
  }

  
  if(this.authGuard.testtoken()){
    this.saving = true;
    this.documentForm.value.url=this.dataFile.url;
    this.actualDoc.name = this.documentForm.value.name;
    this.actualDoc.description = this.documentForm.value.description;
    this.actualDoc.dateDoc = this.documentForm.value.dateDoc;
    this.subscription.add( this.http.put(environment.api+'/api/document/'+this.actualDoc._id, this.actualDoc)
      .subscribe( (res : any) => {
        this.saving = false;
        this.submitted = false;
        this.documentForm.reset();
        if (this.modalReference != undefined) {
          this.modalReference.close();
          this.modalReference = undefined;
          this.dataFile = {};
        }
       }, (err) => {
         console.log(err);
         this.saving = false;
         if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
           this.authGuard.testtoken();
         }else{
         }
       }));
  }
}

getDocs() {
  this.docs = [];
  this.loadedDocs = false;
  this.subscription.add(this.http.get(environment.api + '/api/documents/' + this.authService.getCurrentPatient().sub)
    .subscribe((resDocs: any) => {
      if (resDocs.message) {
        //no tiene historico de docs
      } else {
        resDocs.sort(this.sortService.DateSortInver("date"));
        this.docs = resDocs;

      }

      this.loadedDocs = true;
    }, (err) => {
      console.log(err);
      this.loadedDocs = true;
      this.toastr.error('', this.translate.instant("generics.error try again"));
    }));
}

}
