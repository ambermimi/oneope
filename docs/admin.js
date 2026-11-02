import {initializeApp} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js';
import {getAuth,setPersistence,inMemoryPersistence,GoogleAuthProvider,signInWithPopup,onAuthStateChanged,signOut} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js';
import {getDatabase,ref,get,update} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-database.js';
import {firebaseConfig} from './firebase-config.js';
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getDatabase(app),$=id=>document.getElementById(id);
let pending=null,busy=false;
await setPersistence(auth,inMemoryPersistence);
const status=text=>{$('status').textContent=text;};
$('login').onclick=async()=>{try{await signInWithPopup(auth,new GoogleAuthProvider());}catch{status('ログインできませんでした。ポップアップの許可と、運営用ログインの設定を確認してください。');}};
$('logout').onclick=()=>signOut(auth);
onAuthStateChanged(auth,async user=>{
 pending=null;$('confirm').close();$('admin').hidden=true;$('login').hidden=!!user;$('logout').hidden=!user;
 $('identity').textContent=user?user.email:'';
 if(!user){status('');return;}
 try{const allowed=(await get(ref(db,'operatorAccess'))).val()===true;
 if(auth.currentUser?.uid!==user.uid)return;
 $('admin').hidden=!allowed;status(allowed?'運営としてログインしています。':'このアカウントには運営権限がありません。');
 }catch{status('運営権限を確認できませんでした。');}
});
$('prepare').onclick=async()=>{
 if(busy)return;busy=true;$('prepare').disabled=true;status('削除対象を確認しています…');
 try{const snapshot=await get(ref(db,'chat'));const ids=Object.keys(snapshot.val()||{});
 if(!ids.length){status('削除対象のメッセージはありません。');return;}
 pending={uid:auth.currentUser.uid,ids};$('summary').textContent=ids.length+'件のメッセージと、それらのリアクションを削除します。';
 $('verification').value='';$('execute').disabled=true;$('confirm').showModal();status('まだ削除していません。');
 }catch{status('削除対象を取得できませんでした。権限と接続を確認してください。');}
 finally{busy=false;$('prepare').disabled=false;}
};
$('verification').oninput=()=>{$('execute').disabled=$('verification').value!=='削除'||busy;};
$('cancel').onclick=()=>{$('confirm').close();pending=null;};
$('confirm').addEventListener('cancel',event=>{if(busy)event.preventDefault();else pending=null;});
$('execute').onclick=async()=>{
 if(busy||!pending||$('verification').value!=='削除'||pending.uid!==auth.currentUser?.uid)return;
 busy=true;$('execute').disabled=true;$('cancel').disabled=true;$('logout').disabled=true;
 const count=pending.ids.length,changes={};
 for(const id of pending.ids){changes['chat/'+id]=null;changes['reactions/'+id]=null;}
 try{await update(ref(db),changes);pending=null;$('confirm').close();status(count+'件のメッセージとリアクションを削除しました。');}
 catch{pending=null;$('confirm').close();status('削除を完了できませんでした。接続と権限を確認し、対象を読み込み直してください。');}
 finally{busy=false;$('cancel').disabled=false;$('logout').disabled=false;}
};
