<%@ page language="java" contentType="text/html; charset=ISO-8859-1"
    pageEncoding="ISO-8859-1"%>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">
<title>Connect Globe</title>
<link href="style.css" rel="stylesheet" type="text/css" /> 
<script>
function findcategory(){
	var category;
	if(document.getElementById('cat')!=null)
		category=document.getElementById('cat').value;
	
	var url="findcategory.jsp?category="+category;
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
</script>

</head>
<jsp:include page="header.jsp"></jsp:include>

<body>
	<div id="bg_img">
		<div id="site_div">		
			<div id="main">
				<div class="main_bg">
					<div id="index_box_bot"></div>
					<br/>
					<div id="index_col3">
					<img src="images/contact.png" alt="" title="" style="float: left; padding-right: 10px; padding-bottom: 4px;" />
					<h4>View Reports</h4>
					<div id="log">
						<fieldset>
							<table style="table-layout: fixed;">
								<!-- The first select list -->
								<tr>
									<td>
										<b>Topic: </b>
									</td>
									<td>
										<select name="slist1" id="cat" onchange="findcategory();">
	 									  <option value="harrasment">Harrasment</option>
								  		  <option value="riot">Riot</option>
								  		  <option value="antinationalism">Anti Nationalism</option>
								  		  <option value="bribe">Bribe</option>
								  		  <option value="assault">Sexual Assault</option>
								  		  <option value="others" selected>Others</option>
										</select> 
									</td>
								</tr>
								</table>
								<div id="scontent"></div>
							</fieldset>
						</div>								
					</div>
					<div style="clear: both"></div>
					<div id="location">
					</div>
				</div>
			</div>
		</div>
		<div class="main_bot"></div>		
	</div>
</body>
<jsp:include page="footer.html"></jsp:include>
</html>