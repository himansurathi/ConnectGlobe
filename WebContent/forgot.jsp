<%@ page language="java" import="java.util.*" pageEncoding="ISO-8859-1"%>


<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="content-type" content="text/html; charset=utf-8" />
<title>Connect Globe</title>
<link href="style.css" rel="stylesheet" type="text/css" /> 

<script>
function sendInfo(){
var v=document.getElementById('text1').value;


var url="findname3.jsp?val="+v;
if(window.XMLHttpRequest){
request=new XMLHttpRequest();
}
else if(window.ActiveXObject){
request=new ActiveXObject("Microsoft.XMLHTTP");
}
try
{
request.onreadystatechange=getInfo;
request.open("GET",url,true);
request.send();
}
catch(e){alert("Unable to connect to server");}
}

function getInfo(){
if(request.readyState==4){
var val=request.responseText;
document.getElementById('location').innerHTML=val;
}
else{return true;}
}

</script>
</head>
<jsp:include page="header.jsp"></jsp:include>

<body>
		<div id="bg_img">
			<div id="site_div">
				<div id="main">
					<div class="main_bg">
						<div class="index_prev_bot"></div>
						<div id="index_box">
							<div id="index_box_top"></div>
							<div id="index_col">
								<img src="images/contact.png" alt="" title="" style="float: left; padding-right: 10px; padding-bottom: 4px;" />
								<h4>Recover Password</h4>
								<div id="log">
									<form id="form1">
										<fieldset>
											Enter Your Email:<input id="text1" type="text" name="email" /><br/>
											<input type="button" id="login-submit" onclick="sendInfo()" value="ok" style="margin-right:75%; text-align:center"/><br/><br/>
											<span id="location"></span> 									
										</fieldset>
									</form>
								</div>
							</div>
							<div style="clear: both"></div>
						</div>
					</div>
					<div class="main_bot"></div>
				</div>
			</div>
		</div>
</body>


<jsp:include page="footer.html"></jsp:include>
</html>