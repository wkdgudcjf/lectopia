import java.io.IOException;
import java.util.LinkedList;
import java.util.Queue;

import com.google.android.gcm.server.Constants;
import com.google.android.gcm.server.Message;
import com.google.android.gcm.server.Result;
import com.google.android.gcm.server.Sender;


public class Server 
{
	 static String myApiKey = "AIzaSyDQE3q_rv9wjLoYjFhZZMyHdieq9tsv9vc";
	 static String regId = "APA91bFHlckzzfHZW5e3Zkd6x-6id9hZWIh6bvUHXEVHbeMU_2sZS-4UL6JMsj6tHZJ54RzRSLqZbumPqquqIMkwz2_uD2wZlnVcDzIVhRJb5uZwBXRKOEDUN4ao3uN0cJu1jNBwlb6l";
	 static Queue<GcmQueue> queue = new LinkedList<GcmQueue>();
	 /**
	  * @param args
	  */
	 public static void main(String[] args)
	 {
		 Sender sender = new Sender(myApiKey);
	     String registrationId = regId;
	     String sendmsg = "hi lectopia";
	     Message message = new Message.Builder()
	        .addData("message", sendmsg)
	        .build();
	     
	    Result result;
		try {
			result = sender.send(message, registrationId, 5);
			System.out.println("======= Send ======");
			
		    if (result.getMessageId() != null) {
		    	System.out.println(result.getMessageId());
			    String canonicalRegId = result.getCanonicalRegistrationId();
			    if (canonicalRegId != null) {
				     System.out.println("새 등록아이디로 교체해야 합니다.");
			    }
		    }
			else
			{
			    String error = result.getErrorCodeName();
			    System.out.println("[ERROR]"+error);
			    if (error.equals(Constants.ERROR_NOT_REGISTERED))
			    {
			    	System.out.println("등록되 있지 않은 번호입니다.");
			    }
			    else if(error.equals(Constants.ERROR_UNAVAILABLE)) // 재전송이 필요하다.
			    {
			    	queue.offer(new GcmQueue(registrationId,sendmsg)); // queue에 넣어둔다.
			    }
			}
		} catch (IOException e)
		{
		   e.printStackTrace();
		}
	
		System.out.println("======= END ======");
	}
	public void request() // 1시간 또는 30분 단위로  서버에서 재전송.
	{
		queue.poll();
		//다시 재전송 요청 모듈.
	}
}
