import GoogleCalenderDiary from "./GoogleCalenderDiary.vue";
const googleApiDeta: {
    リダイレクトURL: string,
    クライアントID: string,
    クライアントシークレット: string,
} | undefined = {
    リダイレクトURL: String(process.env.VUE_APP_REDIRECT_URL),
    クライアントID: String(process.env.VUE_APP_CLIENT_ID),
    クライアントシークレット: String(process.env.VUE_APP_CLIENT_SECRET),
};
const v = new GoogleCalenderDiary({
    propsData: {
        googleApiDeta: googleApiDeta
    }
})
v.$mount("#app");
