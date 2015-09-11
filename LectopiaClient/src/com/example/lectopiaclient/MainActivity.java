package com.example.lectopiaclient;

import java.io.IOException;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager.NameNotFoundException;
import android.os.AsyncTask;
import android.os.Bundle;
import android.text.TextUtils;
import android.util.Log;
import android.widget.TextView;

import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GooglePlayServicesUtil;
import com.google.android.gms.gcm.GoogleCloudMessaging;

public class MainActivity extends Activity
{
	private static final String TAG = MainActivity.class.getName();
    private final static int PLAY_SERVICES_RESOLUTION_REQUEST = 9000;
    private static final String SENDER_ID = "397859990552";
 
    private GoogleCloudMessaging _gcm;
    private String _regId;
 
    private TextView _textStatus;
 
    @Override
    protected void onCreate(Bundle savedInstanceState)
    {
       super.onCreate(savedInstanceState);
       setContentView(R.layout.activity_main);
 
       _textStatus = (TextView) findViewById(R.id.textView1);
 
       // google play service가 사용가능한가
       if (checkPlayServices())
       {
          _gcm = GoogleCloudMessaging.getInstance(this);
          _regId = getRegistrationId(); // 이미 등록되어 있꺼나 버젼이 변경됬는지 확인한다.
 
          if (TextUtils.isEmpty(_regId))
             registerInBackground();
       }
       else
       {
          Log.i(TAG, "플레이 서비스를 사용할 수 없습니다.");
          _textStatus.append("\n 플레이 서비스를 사용할 수 없습니다. \n");
       }
 
       // display received msg
       String msg = getIntent().getStringExtra("msg");
       if (!TextUtils.isEmpty(msg))
          _textStatus.append("\n" + msg + "\n");
   }
 
   @Override
   protected void onNewIntent(Intent intent)
   {
      super.onNewIntent(intent);
 
      // display received msg
      String msg = intent.getStringExtra("msg");
      Log.i(TAG, "|" + msg + "|");
      if (!TextUtils.isEmpty(msg))
         _textStatus.append("\n" + msg + "\n");
   }
 
   // google play service가 사용가능한가
   private boolean checkPlayServices()
   {
      int resultCode = GooglePlayServicesUtil.isGooglePlayServicesAvailable(this);
      if (resultCode != ConnectionResult.SUCCESS)
      {
         if (GooglePlayServicesUtil.isUserRecoverableError(resultCode))
         {
            GooglePlayServicesUtil.getErrorDialog(resultCode, this, PLAY_SERVICES_RESOLUTION_REQUEST).show();
         }
         else
         {
            Log.i(TAG,"서비스를 지원하지 않습니다.");
            _textStatus.append("\n 서비스를 지원하지 않습니다. \n");
            finish();
         }
         return false;
      }
      return true;
   }
 
   // registration  id를 가져온다.
   private String getRegistrationId()
   {
      String registrationId = PreferenceUtil.instance(getApplicationContext()).regId();
      if (TextUtils.isEmpty(registrationId))
      {
         Log.i(TAG, "키값이 등록이 되어있지 않습니다.");
         _textStatus.append("\n 키값이 등록이 되어있지 않습니다. \n");
         return "";
      }
      int registeredVersion = PreferenceUtil.instance(getApplicationContext()).appVersion();
      int currentVersion = getAppVersion();
      if (registeredVersion != currentVersion)
      {
         Log.i(TAG, "앱의 버젼이 변경되었습니다.");
         _textStatus.append("\n 앱의 버젼이 변경되었습니다. \n");
         return "";
      }
      return registrationId;
   }
 
   // app version을 가져온다.
   private int getAppVersion()
   {
      try
      {
         PackageInfo packageInfo = getPackageManager().getPackageInfo(getPackageName(), 0);
         return packageInfo.versionCode;
      }
      catch (NameNotFoundException e)
      {
         throw new RuntimeException("패키지명을 찾을수 없습니다: " + e);
      }
   }
 
   // gcm 서버에 접속해서 registration id를 발급받는다.
   private void registerInBackground()
   {
      new AsyncTask<Void, Void, String>()
      {
         @Override
         protected String doInBackground(Void... params)
         {
            String msg = "";
            try
            {
               if (_gcm == null)
               {
                  _gcm = GoogleCloudMessaging.getInstance(getApplicationContext());
               }
               _regId = _gcm.register(SENDER_ID);
               msg = "등록된 아이디 =" + _regId;
               storeRegistrationId(_regId);
            }
            catch (IOException ex)
            {
               msg = "Error :" + ex.getMessage();
            }
 
            return msg;
         }
 
         @Override
         protected void onPostExecute(String msg)
         {
            Log.i(TAG, msg);
            _textStatus.append(msg);
         }
      }.execute(null, null, null);
   }
 
   // registraion id를 preference에 저장한다.
   private void storeRegistrationId(String regId)
   {
      int appVersion = getAppVersion();
      Log.i(TAG, "저장된 버젼 : " + appVersion);
      PreferenceUtil.instance(getApplicationContext()).putRedId(regId);
      PreferenceUtil.instance(getApplicationContext()).putAppVersion(appVersion);
   }
}
