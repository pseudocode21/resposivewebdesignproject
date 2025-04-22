document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const uploadArea = document.getElementById('upload-area');
    const uploadBtn = document.getElementById('upload-btn');
    const imageUpload = document.getElementById('image-upload');
    const previewContainer = document.getElementById('preview-container');
    const previewImage = document.getElementById('preview-image');
    const clearBtn = document.getElementById('clear-btn');
    const generateBtn = document.getElementById('generate-btn');
    const loader = document.querySelector('.loading-container');
    const resultsSection = document.getElementById('results-section');
    const descriptionContent = document.getElementById('description-content');
    const copyBtn = document.getElementById('copy-btn');
    const shareBtn = document.getElementById('share-btn');

    // API configuration
    const API_TOKEN = "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";
    const MODEL_URL = "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large";

    let selectedFile = null;

    // Add click event for the upload button
    uploadBtn.addEventListener('click', function() {
        imageUpload.click();
    });

    // Handle drag and drop events
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('active');
    });

    uploadArea.addEventListener('dragleave', function() {
        uploadArea.classList.remove('active');
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('active');
        
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    // Handle file input change
    imageUpload.addEventListener('change', function() {
        if (this.files.length) {
            handleFile(this.files[0]);
        }
    });

    // Handle clear button click
    clearBtn.addEventListener('click', function() {
        resetUploadArea();
    });

    // Handle generate button click
    generateBtn.addEventListener('click', function() {
        if (selectedFile) {
            generateDescription();
        }
    });

    // Process the selected file
    function handleFile(file) {
        // Check file type
        if (!file.type.match('image.*')) {
            showNotification('Please select an image file (JPEG, PNG, or WEBP).', 'error');
            return;
        }

        // Check file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            showNotification('Image size exceeds 5MB limit. Please select a smaller image.', 'error');
            return;
        }

        selectedFile = file;
        
        // Show image preview
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImage.src = e.target.result;
            uploadArea.style.display = 'none';
            previewContainer.style.display = 'block';
            generateBtn.disabled = false;
        };
        reader.readAsDataURL(file);
    }

    // Reset the upload area
    function resetUploadArea() {
        selectedFile = null;
        imageUpload.value = '';
        previewImage.src = '#';
        uploadArea.style.display = 'block';
        previewContainer.style.display = 'none';
        generateBtn.disabled = true;
        resultsSection.style.display = 'none';
    }

    // Generate image description
    async function generateDescription() {
        // Show loader and hide results
        loader.style.display = 'flex';
        resultsSection.style.display = 'none';
        
        try {
            // Prepare image data
            const reader = new FileReader();
            reader.readAsArrayBuffer(selectedFile);
            
            reader.onload = async function() {
                try {
                    // Convert array buffer to base64
                    const base64Image = arrayBufferToBase64(reader.result);
                    
                    // Make API request
                    const response = await fetch(MODEL_URL, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${API_TOKEN}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            inputs: base64Image,
                            options: {
                                wait_for_model: true
                            }
                        })
                    });
                    
                    if (!response.ok) {
                        throw new Error(`API request failed with status ${response.status}`);
                    }
                    
                    const result = await response.json();
                    
                    // Display the result
                    displayDescription(result);
                    
                } catch (error) {
                    console.error('Error generating description:', error);
                    showNotification('Error generating description. Please try again.', 'error');
                    loader.style.display = 'none';
                }
            };
            
        } catch (error) {
            console.error('Error reading file:', error);
            showNotification('Error processing image. Please try again.', 'error');
            loader.style.display = 'none';
        }
    }

    // Convert ArrayBuffer to base64
    function arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        
        return btoa(binary);
    }

    // Display the generated description
    function displayDescription(result) {
        // Hide loader
        loader.style.display = 'none';
        
        // Get description text from result 
        // BLIP returns either a string or an array of strings
        let description = '';
        
        if (typeof result === 'string') {
            description = result;
        } else if (Array.isArray(result)) {
            description = result[0].generated_text || 'No description available';
        } else if (result.generated_text) {
            description = result.generated_text;
        } else {
            description = 'No description available';
        }
        
        // Format description (capitalize first letter and add period if needed)
        description = description.charAt(0).toUpperCase() + description.slice(1);
        if (!description.endsWith('.') && !description.endsWith('!') && !description.endsWith('?')) {
            description += '.';
        }
        
        // Display description
        descriptionContent.textContent = description;
        resultsSection.style.display = 'block';
    }

    // Show notification
    function showNotification(message, type) {
        alert(message); // Simple alert for now, could be replaced with a better notification system
    }

    // Handle copy button
    copyBtn.addEventListener('click', function() {
        const description = descriptionContent.textContent;
        navigator.clipboard.writeText(description)
            .then(() => {
                showNotification('Description copied to clipboard!', 'success');
            })
            .catch(err => {
                console.error('Could not copy text: ', err);
                showNotification('Failed to copy to clipboard. Please try again.', 'error');
            });
    });

    // Handle share button
    shareBtn.addEventListener('click', function() {
        const description = descriptionContent.textContent;
        
        if (navigator.share) {
            navigator.share({
                title: 'AI Generated Image Description',
                text: description,
            })
            .catch(err => {
                console.error('Share failed:', err);
                showNotification('Failed to share. Please try again.', 'error');
            });
        } else {
            showNotification('Web Share API not supported in your browser.', 'error');
        }
    });

    // FAQ toggle functionality
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling;
            const icon = question.querySelector('.toggle-icon');
            
            // Toggle answer visibility
            answer.style.display = answer.style.display === 'block' ? 'none' : 'block';
            
            // Toggle icon
            icon.textContent = answer.style.display === 'block' ? '−' : '+';
        });
    });

    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const authButtons = document.querySelector('.auth-buttons');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            authButtons.classList.toggle('active');
            
            // Toggle menu icon
            const icon = mobileMenuBtn.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.navbar') && !event.target.closest('.mobile-menu-btn')) {
            navLinks.classList.remove('active');
            authButtons.classList.remove('active');
            
            // Reset menu icon
            const icon = mobileMenuBtn.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        }
    });
}); 