package com.example.lectopiaclient;

import android.app.IntentService;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.support.v4.app.NotificationCompat;
import android.util.Log;

import com.google.android.gms.gcm.GoogleCloudMessaging;
public class GcmIntentService extends IntentService
{
   public static final int NOTIFICATION_ID = 1;
   private static final String TAG = GcmBroadcastReceiver.class.getName();
   public GcmIntentService()
   {
      super("GcmIntentService");
   }
 
   @Override
   protected void onHandleIntent(Intent intent)
   {
      Bundle extras = intent.getExtras();
      GoogleCloudMessaging gcm = GoogleCloudMessaging.getInstance(this);
      String messageType = gcm.getMessageType(intent);
      
      if (!extras.isEmpty())
      {
         if (GoogleCloudMessaging.MESSAGE_TYPE_SEND_ERROR.equals(messageType))
         {
            sendNotification("Send error: " + extras.toString());
         }
         else if (GoogleCloudMessaging.MESSAGE_TYPE_DELETED.equals(messageType))
         {
            sendNotification("Deleted messages on server: " + extras.toString());
         }
         else if (GoogleCloudMessaging.MESSAGE_TYPE_MESSAGE.equals(messageType))
         {
            String msg = intent.getStringExtra("message");
            sendNotification("Received: " + msg);
            Log.i(TAG, "Received: " + extras.toString());
         }
      }
      GcmBroadcastReceiver.completeWakefulIntent(intent);
   }
 
   private void sendNotification(String msg)
   {
      NotificationManager mNotificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
 
      Intent intent = new Intent(getApplicationContext(), MainActivity.class);
      intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      intent.putExtra("msg", msg);
 
      PendingIntent contentIntent = PendingIntent.getActivity(this, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT);
 
      NotificationCompat.Builder mBuilder = new NotificationCompat.Builder(this).setSmallIcon(R.drawable.ic_launcher)
                                                                                .setContentTitle("GCM Notification")
                                                                                .setStyle(new NotificationCompat.BigTextStyle().bigText(msg))
                                                                                .setContentText(msg)
                                                                                .setAutoCancel(true)
                                                                                .setVibrate(new long[] { 0, 500 });
       mBuilder.setContentIntent(contentIntent);
       mNotificationManager.notify(NOTIFICATION_ID, mBuilder.build());
   }
}