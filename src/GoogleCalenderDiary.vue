<template>
  <div style="display:flex;flex-direction:column;height:100%;">
    <cool-select
      :items="calenderList"
      :disabled="isDisabledUI"
      v-model="selectedCalender"
      @select="selectCalender"
      disable-search
    >
      <template #item="{item}">
        <div style="display:flex;align-items: center;flex: 1 1 0;">
          <div
            style="flex:0 0 10px;height: 10px;border-radius: 6px;margin-right: 10px;"
            v-bind:style="{backgroundColor:item.color}"
          ></div>
          <div style="flex:1 1 0;">
            <b>{{ item.name }}</b>
          </div>
          <div style="flex:0 0 auto;color:gray;" v-if="item.accessRole=='reader'">
            <b>reader</b>
          </div>
          <div style="flex:0 0 auto;color:gray;" v-if="item.primary==true">
            <b>primary</b>
          </div>
        </div>
      </template>
      <template #selection="{item}">
        <div style="display:flex;align-items: center;flex: 1 1 0;">
          <div
            style="flex:0 0 10px;height: 10px;border-radius: 6px;margin-right: 10px;"
            v-bind:style="{backgroundColor:item.color}"
          ></div>
          <div style="flex:1 1 0;">
            <b>{{ item.name }}</b>
          </div>
          <div style="flex:0 0 auto;color:gray;" v-if="item.accessRole=='reader'">
            <b>reader</b>
          </div>
          <div style="flex:0 0 auto;color:gray;" v-if="item.primary==true">
            <b>primary</b>
          </div>
        </div>
      </template>
    </cool-select>
    <div style="flex:1 1 0;padding:10px 0;" v-if="表示ステータス=='認証OK'">
      <textarea
        style="width:100%;height:100%;"
        data-input-textarea
        placeholder="日記の内容を入力"
        v-model="入力中のテキスト"
        :disabled="isDisabledUI"
      ></textarea>
    </div>
    <div
      style="flex:1 1 0;padding:10px 0;display: flex;align-items: center;justify-content: center;"
      v-else-if="表示ステータス == '認証前'"
    >
      <button v-on:click="auth_start_push" style="padding:10px;">認証開始</button>
    </div>
    <div
      style="flex:1 1 0;padding:10px 0;display: flex;align-items: center;justify-content: center;"
      v-else-if="表示ステータス == '確認中'"
    >api確認中</div>
    <div style="flex:0 0 50px;">
      <button
        :disabled="isDisabledClearText"
        @click="入力中のテキスト='';入力開始時刻=new Date();saveInputStatus();"
        style="font-size:large;width:30%;height:100%;"
      >クリア</button>
      <button
        :disabled="isDisabledSubmit"
        @click="onPushSubmit"
        style="font-size:large;width:70%;height:100%;"
      >{{f(入力開始時刻)}}の日記に記録</button>
    </div>
  </div>
</template>
<script lang="ts">
import dateformat from "dateformat";
import VueSelect, { CoolSelect } from 'vue-cool-select';
import { Prop, Vue, Component } from "vue-property-decorator";
import { GoogleApi } from "./google-api"
import { Storage } from "./storage";
Vue.use(VueSelect, {
  theme: 'material-design' // or 'material-design'
});
@Component({
  components: { CoolSelect }
})
export default class GoogleCalenderDiary extends Vue {
  @Prop()
  googleApiDeta?: {
    リダイレクトURL: string,
    クライアントID: string,
    クライアントシークレット: string,
  };
  googleApiAccessToken = "";
  calenderList = [] as GoogleApi.Calender.CalenderType[];
  selectedCalender = null as GoogleApi.Calender.CalenderType | null;
  表示ステータス = "確認中" as ("確認中" | "認証前" | "認証OK");
  登録中 = false as boolean;
  入力中のテキスト = "" as string;
  入力開始時刻 = new Date();
  async mounted(): Promise<void> {
    //this.$el.querySelector<HTMLTextAreaElement>("textarea[data-input-textarea]")!.focus()
    const r = await GoogleApi.Auth.setup(this.googleApiDeta ? Object.assign(this.googleApiDeta, { リフレッシュトークン: Storage.googleApiRefreshToken }) : undefined)
    if (r === "no-token") {
      this.表示ステータス = "認証前";
    } else if (r.mode == "get-refresh-token") {
      Storage.googleApiRefreshToken = r.refreshToken;
      document.location.href = r.redirectUrl;
    } else if (r.mode == "get-access-token") {
      this.googleApiAccessToken = r.accessToken;
      GoogleApi.Calender.getCalenderList(this.googleApiAccessToken).then(calenderListApiResult => {
        this.calenderList = ([] as GoogleApi.Calender.CalenderType[]).concat(
          calenderListApiResult.filter(a => a.primary),
          calenderListApiResult.filter(a => a.accessRole == "owner" && a.primary == false),
          calenderListApiResult.filter(a => a.accessRole == "reader"),
        );
        const storageCalender = this.calenderList.find(a => a.id == Storage.calenderId);
        if (storageCalender) {
          this.selectedCalender = storageCalender;
        } else {
          this.selectedCalender = 0 < this.calenderList.length ? this.calenderList[0] : null;
        }
        const inputStatus = Storage.inputStatus;
        if (inputStatus) {
          this.入力開始時刻 = inputStatus.入力開始時刻
          this.入力中のテキスト = inputStatus.入力値
        } else {
          this.saveInputStatus()
        }
        this.表示ステータス = "認証OK";
      })
    }
  }
  get isDisabledUI(): boolean {
    return this.表示ステータス !== '認証OK' || this.登録中;
  }
  get isDisabledClearText(): boolean {
    return this.isDisabledUI;
  }
  get isDisabledSubmit(): boolean {
    return this.isDisabledUI || this.入力中のテキスト.trim() == "";
  }
  auth_start_push(): void {
    const url = GoogleApi.Auth.getAuthStartUrl({
      クライアントID: this.googleApiDeta!.クライアントID,
      リダイレクトURI: this.googleApiDeta!.リダイレクトURL
    });
    document.location.href = url;
  }
  onPushSubmit() {
    this.登録中 = true;
    const calenderId = this.selectedCalender!.id;
    GoogleApi.Calender.postSchedule(this.googleApiAccessToken, new Date(), this.入力中のテキスト, calenderId).then(() => {
      this.入力開始時刻 = new Date();
      this.入力中のテキスト = "";
      this.saveInputStatus();
      this.登録中 = false;
    })
  }
  selectCalender(calenderData: GoogleApi.Calender.CalenderType) {
    Storage.calenderId = calenderData.id;
  }
  saveInputStatus() {
    Storage.inputStatus = {
      入力開始時刻: this.入力開始時刻,
      入力値: this.入力中のテキスト
    };
  }
  f(v: Date) {
    return dateformat(v, "yyyy-mm-dd HH:MM");
  }
}
</script>

<style lang="scss" scoped>
* {
  margin: 0;
  padding: 0;
}
</style>
