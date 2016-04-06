<%@ page language="java" import="java.util.*" pageEncoding="ISO-8859-1"%>


<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="content-type" content="text/html; charset=utf-8" />
<title>Connect Globe</title>
	<script type="text/javascript">

function findarea(){
var country,state,district,police;
if(document.getElementById('coun')!=null)
	country=document.getElementById('coun').value;
if(document.getElementById('sta')!=null)
	state=document.getElementById('sta').value;
if(document.getElementById('dis')!=null)
	district=document.getElementById('dis').value;
if(document.getElementById('pol')!=null)
	police=document.getElementById('pol').value;

var url="findname4.jsp?country="+country+"&state="+state+"&district="+district+"&police="+police;
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
<link href="style.css" rel="stylesheet" type="text/css" /> 
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
										<b>Country: </b>
									</td>
									<td>
										<select required name="slist1" id="coun" onchange="SList.getSelect('slist2', this.value);">
	 									<option value="" selected>Select Your Country</option>
	 									<option value="India" >India</option>
	 									<option value="USA">USA</option>
										</select>
									</td>
								</tr>
								<tr id="slist2">
									<td >
									</td>
								</tr> 
								<tr id="slist3">
									<td >
									</td>
								</tr>
								<tr id="slist4">
									<td >
									</td>
								</tr> 
			
								<script><!--
									/* Script Triple Select Dropdown List, from: coursesweb.net/javascript/ */
									var SList = new Object();             // JS object that stores data for options
									
									// HERE replace the values with the text you want to be displayed near Select
									var txtsl2 = '<td><B>State:</B></td>';         // text for the seccond dropdown list
									var txtsl3 = '<td><B>District:</B></td>';         // text for the third dropdown list
									var txtsl4 = '<td><B>PoliceStation:</B></td>';  
									/*
									 Property with options for the Seccond select list
									 The key in this object must be the same with the values of the options added in the first select
									 The values in the array associated to each key represent options of the seccond select
									*/
									SList.slist2 = {
									 "India": ['Uttar Pradesh', 'Madhya Pradesh'],
									 "USA": ['New York','Washington'],
									};
									
									/*
									 Property with options for the Third select list
									 The key in this object must be the same with the values (options) added in each Array in "slist2" above
									 The values in the array associated to each key represent options of the third select
									*/
									SList.slist3 = {
									 "Uttar Pradesh": ['Ghaziabad', 'Etawah'],
									 "Madhya Pradesh": ['Bhopal', 'Ujjain', 'Indore'],
									};
									
									/*
									 Property with content associated to the options of the third select list
									 The key in this object must be the same with the values (options) added in each Array in "slist3" above
									 The values of each key represent the content displayed after the user selects an option in 3rd dropdown list
									*/
									SList.slist4 = {
									 "Ghaziabad": ['Modinagar', 'Mohan Nagar'],
									 "Etawh": ['Gandhinagar', 'AL Colony'],
									 "Bhopal": ['BB Ambedkar'],
									 "Indore": ['AC Market', 'Mahakaleshwar', 'Outer Area'],
									};
									
									
									
									
									    /* From here no need to modify */
									
									// function to get the dropdown list, or content
									SList.getSelect = function(slist, option) {
									  document.getElementById('scontent').innerHTML = '';           // empty option-content
									
									  if(SList[slist][option]) {
									    // if option from the last Select, add text-content, else, set dropdown list
									    if(slist == 'scontent') document.getElementById('scontent').innerHTML = SList[slist][option];
									    else {
									      var addata = '';
									      for(var i=0; i<SList[slist][option].length; i++) {
									        addata += '<option value="'+SList[slist][option][i]+'">'+SList[slist][option][i]+'</option>';
									      }
									
									      // cases for each dropdown list
									      switch(slist) {
									        case 'slist2':
									          document.getElementById('slist2').innerHTML = txtsl2+' <td><select name="slist2" id="sta" onchange="SList.getSelect(\'slist3\', this.value);">'+addata+'</select></td>';
									          document.getElementById('slist3').innerHTML = '';
									          document.getElementById('slist4').innerHTML = '';
									          break;
									        case 'slist3':
									          document.getElementById('slist3').innerHTML = txtsl3+' <td><select name="slist3" id="dis" onchange="SList.getSelect(\'slist4\', this.value);">'+addata+'</select></td>';
									           document.getElementById('slist4').innerHTML = '';
									          break;
									            case 'slist4':
									          document.getElementById('slist4').innerHTML = txtsl4+' <td><select required name="slist4" id="pol">'+addata+'</select></td>';
									          break;
									      }
									    }
									  }
									  else {
									    // empty the tags for select lists
									    if(slist == 'slist2') {
									      document.getElementById('slist2').innerHTML = '';
									      document.getElementById('slist3').innerHTML = '';
									      document.getElementById('slist4').innerHTML = '';
								          }
									    else if(slist == 'slist3') {
									      document.getElementById('slist3').innerHTML = '';
									      document.getElementById('slist4').innerHTML = '';
								          }
									    else if(slist == 'slist4') {
									      document.getElementById('slist4').innerHTML = '';
									    }
									  }
									}
									-->
									</script>
									<tr>
										<td>
										</td>
										<td>
											<br/>
											<button onclick="findarea()">Search</button>								
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