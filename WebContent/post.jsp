<%@ page language="java" import="java.util.*" pageEncoding="ISO-8859-1"%>

<jsp:include page="header.jsp"></jsp:include>

<%
String islogin=(String)session.getAttribute("islogin");
if(islogin==null){
request.setAttribute("notlogin_msg","Sorry!!!!!,You need to  Login first");

%>
<jsp:forward page="index.jsp"></jsp:forward>
<%
}
%>
<body>
	<div id="bg_img">
		<div id="site_div">
			<div id="main">
				<div class="main_bg">
					<div class="index_prev_bot"></div>
					<div id="index_col">
					<img src="images/contact.png" alt="" title="" style="float: left; padding-right: 10px; padding-bottom: 4px;" />
					<h4>Post Report</h4>
				 	<div id="log">
						<FORM action="uploadimage.jsp" METHOD=POST name="form">
							<fieldset>
								<table style="table-layout: fixed;">
									<!-- The first select list -->
									<tr>
										<td>
											<B>Country:</B> 
										</td>
										<td>	
											<select name="slist1" onchange="SList.getSelect('slist2', this.value);">
													<option value="country" selected>Select a Country</option>
						 							<option value="India" >India</option>
						 							<option value="s1_opt2">USA</option>
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
									 "s1_opt2": ['New York','Washington'],
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
									      var addata = '<option>Select Please</option>';
									      for(var i=0; i<SList[slist][option].length; i++) {
									        addata += '<option value="'+SList[slist][option][i]+'">'+SList[slist][option][i]+'</option>';
									      }
									
									      // cases for each dropdown list
									      switch(slist) {
									        case 'slist2':
									          document.getElementById('slist2').innerHTML = txtsl2+' <td><select name="slist2" onchange="SList.getSelect(\'slist3\', this.value);">'+addata+'</select></td>';
									          document.getElementById('slist3').innerHTML = '';
									          break;
									        case 'slist3':
									          document.getElementById('slist3').innerHTML = txtsl3+' <td><select name="slist3" onchange="SList.getSelect(\'slist4\', this.value);">'+addata+'</select></td>';
									           document.getElementById('slist4').innerHTML = '';
									          break;
									            case 'slist4':
									          document.getElementById('slist4').innerHTML = txtsl4+' <td><select name="slist4" onchange="SList.getSelect(\'scontent\', this.value);">'+addata+'</select></td>';
									          break;
									      }
									    }
									  }
									  else {
									    // empty the tags for select lists
									    if(slist == 'slist2') {
									      document.getElementById('slist2').innerHTML = '';
									      document.getElementById('slist3').innerHTML = '';
									    }
									    else if(slist == 'slist3') {
									      document.getElementById('slist3').innerHTML = '';
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
								  	  	<B>Your Report:</B>
									  </td>
		      					  	<td>
									  	<textarea rows="6" cols="100" name="report" style="margin-top: 2%"></textarea>
									  	<br/>
								  	</td>
								  </tr>									
    							  <tr>
										<td>
										<B>Category:</B>
										</td>
										<td>
										 <select name="category" >
										  <option value="harrasment">Harrasment</option>
								  		  <option value="riot">Riot</option>
								  		  <option value="antinationalism">Anti Nationalism</option>
								  		  <option value="bribe">Bribe</option>
								  		  <option value="assault">Sexual Assault</option>
								  		  <option value="others" selected>Others</option>
										</select> 
										<br/>
										</td>
									</tr>									
								  <tr>
								  	<td></td>
								  	<td >
								  		<input  type="submit" value="submit" ondblclick="var s=form.report.value; s=s.replace(/&amp;/g,'&amp;amp;');s=s.replace(/&lt;/g,'&amp;lt;');s=s.replace(/&gt;/g,'&amp;gt;');s=s.replace(/\n/g,'&lt;br /&gt;\n');s=s.replace(/\r/g,'');form.report.value = s;"/>
								  	</td>
								  </tr>
								</table>
								<div id="scontent"></div>
							</fieldset>
						</form>
						</div>
					</div>
				</div>
			</div>
		</div>
		<div style="clear: both"></div>
		<div class="main_bot"></div>		
	</div>
</body>
<jsp:include page="footer.html"></jsp:include>
