
$(document).ready(function(){
	projectId = $("body").data('project-id') ? $("body").data('project-id') : 'Test';
    GUI.Instance.initialize(projectId);
})