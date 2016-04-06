<%@ page language="java" import="java.util.*" pageEncoding="ISO-8859-1"%>


<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
	<title>Connect Globe</title>
	<link href="style.css" rel="stylesheet" type="text/css" /> 
</head>

<jsp:include page="header.jsp"></jsp:include>

<script type="text/javascript">

function required()  
{  
var empt = document.forms["form1"]["username"].value;  
if (empt == "")  
{  
alert("Username can't be blank");  
return false;  
}  
else   
{  
var empt = document.forms["form1"]["userpass"].value;  
if (empt == "")  
{  
alert("Password can't be blank");  
return false;  
}  
else   
{  
var empt = document.forms["form1"]["email"].value;  
if (empt == "")  
{  
alert("Please Enter valid Email id");  
return false;  
}  
else   
{
var email = document.forms["form1"]["email"].value; 
var validemail =/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,4}$/;
if(!(validemail.test(email))){
alert("Invalid email address")
form1.email.focus
return false
}
var empt = document.forms["form1"]["mobile"].value;  
if (empt == "")  
{  
alert("Please Enter valid Mobile no. with country code ");  
return false;  
}  
else   
{  
var empt = document.forms["form1"]["address"].value;  
if (empt == "")  
{  
alert("Address can't be blank,Please Fill valid address");  
return false;  
}  
else   
{  
return true;   
}  
}     
}  
}     
}  
}       
  




function validate(){
var v=document.getElementById('text1').value;


var url="findname.jsp?val="+v;
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
}
function validate1(){
var v=document.getElementById('text3').value;


var url="findname1.jsp?val="+v;
if(window.XMLHttpRequest){
request=new XMLHttpRequest();
}
else if(window.ActiveXObject){
request=new ActiveXObject("Microsoft.XMLHTTP");
}
try
{
request.onreadystatechange=getInfoe;
request.open("GET",url,true);
request.send();
}
catch(e){alert("Unable to connect to server");}
}

function getInfoe(){
if(request.readyState==4){
var val=request.responseText;
document.getElementById('location1').innerHTML=val;
}

}
</script>

		
</head>


<body>
<%session.invalidate(); %>
		<div id="bg_img">
			<div id="site_div">
				<div id="main">
					<div class="main_bg">				
						<div class="index_prev_bot"></div>
							<div id="index_box">
							<div id="index_box_top"></div>
							<div id="index_box_bg">
								<h3 align="center">Now You can Share Your Social Problem such as some kind of Harassment,Bribe matters.</h3>
								<p>Simply just Register Yourself and Do login After that click on Post Report Link as shown above.And After selecting Your subject and location YOu can post Your matter Simply .This will be visible to every visitors and our Supporters will try to proceed it further</p>
								
							</div>
							<div id="index_box_bot"></div>
						</div>

						<div id="index_col">							
							<div id="index_col">
								<img src="images/contact.png" alt="" title="" style="float: left; padding-right: 10px; padding-bottom: 4px;" />
								<h4>Registration</h4>
								<div id="log">
								
								<%if(request.getAttribute("regerr")!=null){
								out.print("<font style='color:red'>"+request.getAttribute("regerr")+"</font>");
								} %>
									<form id="commentform" method="post" action="registerprocess.jsp" onsubmit="return required()" name="form1">
										<fieldset>
											User Name:<span id="location"></span><input id="text1" type="text" name="username"  onblur="validate()" style="margin-left:35%; text-align:center"/><br/>
											Password:<input id="text2" type="password" name="userpass" style="margin-left:35%; text-align:center"/><br/>
											Email:<span id="location1"></span><input id="email" type="email" name="email" onblur="validate1()" style="margin-left:35%; text-align:center"/><br/>
											Mobile:<input id="text3" type="number" name="mobile" style="margin-left:35%; text-align:center"/><br/>
											Address:<input id="text3" type="text" name="address" style="margin-left:35%; text-align:center"/><br/>
											<input type="submit" id="login-submit" value="Register" style="margin-right:40%; text-align:center"/>
										</fieldset>
									</form>
								</div>
							</div>
							<div style="clear: both"></div>
						</div>
					</div>
					<div class="main_bot"></div>
				</div>

				</div></div>
				</body>


<jsp:include page="footer.html"></jsp:include>
</html>