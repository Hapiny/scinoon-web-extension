/**
 * This file contains common types will be used by extension and its backend
 */
const messages = {
	success : {
		EXTRACT                  : 'extract data',
		RETURN_EXTRACTED         : 'return extracted',
		COPY                     : 'copy',
		NORMALIZED_DATA          : 'normalized data arrive',
		RM_UPDATED               : 'research map is updated',
		SELECTED_ARTICLES        : 'selected articles',
		SET_DEFAULT_MAP          : 'set default map',
		DEFAULT_MAP_CHANGED      : 'default map changed',
		EXTRACTED_TERMS_RESEARCH : 'extracted terms research',
		EXTRACTED_TERMS_CLUSTERS : 'extracted terms clusters',
		GET_TERMS                : 'get terms',
	},
	error : {
		NORMALIZED_ERROR : {
			text : "Error in data normalization!!!",
			info : (jqXHR, textStatus, errorThrown) => {
				console.log(messages.error.NORMALIZED_ERROR.text);
				// alert(messages.error.NORMALIZED_ERROR.text);
				console.log("Status: ", textStatus);
				if (errorThrown) {
					console.log(errorThrown);
				}
			},
		},
		EXTRACTED_TERMS_ERROR : {
			text : "Error in term extraction!!!",
			info : (jqXHR, textStatus, errorThrown) => {
				console.log(messages.error.EXTRACTED_TERMS_ERROR.text);
				// alert(messages.error.EXTRACTED_TERMS_ERROR.text);
				console.log("Status: ", textStatus);
				if (errorThrown) {
					console.log(errorThrown);
				}
			},
		},
	}
};
