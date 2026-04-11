document.addEventListener('DOMContentLoaded', () => {
    const educationLevelSelect = document.getElementById('educationLevel');
    const marksGroup = document.getElementById('marksGroup');
    const marksLabel = document.getElementById('marksLabel');
    const marksInput = document.getElementById('marks');
    const branchGroup = document.getElementById('branchGroup');
    const branchInput = document.getElementById('branch');
    
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const loader = submitBtn.querySelector('.loader');
    const resultsSection = document.getElementById('resultsSection');

    // Conditional Display Logic for Marks / CGPA and Branch
    educationLevelSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'school') {
            marksGroup.style.display = 'flex';
            marksLabel.textContent = 'School Marks / Percentage';
            marksInput.placeholder = 'e.g., 90% or 3.8 GPA';
            branchGroup.style.display = 'none';
        } else if (val === 'college') {
            marksGroup.style.display = 'flex';
            marksLabel.textContent = 'University CGPA';
            marksInput.placeholder = 'e.g., 8.5 out of 10';
            branchGroup.style.display = 'flex';
        } else {
            marksGroup.style.display = 'none';
            branchGroup.style.display = 'none';
        }
    });

    // Form Submission and API Call
    submitBtn.addEventListener('click', async () => {
        // Collect Inputs
        const apiKey = document.getElementById('apiKey').value.trim();
        const interest = document.getElementById('interest').value.trim();
        const education = educationLevelSelect.value;
        const marks = marksInput.value.trim();
        const branch = branchInput.value.trim();
        const ambition = document.getElementById('ambition').value.trim();

        // Validation
        if (!apiKey) {
            showError("Please enter your Gemini API Key.");
            return;
        }
        if (!interest || !education || !marks || !ambition || (education === 'college' && !branch)) {
            showError("Please fill in all the details so we can find your ideal career path.");
            return;
        }

        // Prepare Prompt
        const eduLevelText = education === 'school' ? 'School Completed' : `College / University Degree in ${branch}`;
        const marksText = education === 'school' ? `School Marks: ${marks}` : `University CGPA: ${marks}`;

const promptTemplate = `
You are an expert career counselor. Based on the following details of a student, recommend the best TWO career paths. 
Crucially, your recommendations MUST be split this way:
- Path 1: A career option that involves pursuing extensive higher education, rigorous advanced study, or highly specialized degrees.
- Path 2: A feasible, practical career option that requires less formal study, allowing them to enter the field sooner with minimal higher education.

Student Details:
- Interests: ${interest}
- Education Level: ${eduLevelText}
- Academic Performance: ${marksText}
- Ambition / Dream: ${ambition}

For EACH of the two career paths, provide the following information formatted beautifully using Markdown:
1. Career Path Name (Must strictly be formatted as a Markdown Heading 2, e.g., ## 1. Career Name)
2. Subjects to focus on in school/college
3. Key Exams to prepare for
4. Type of colleges, universities, or specific institutions to aim for
5. A realistic backup plan if the primary path doesn't work out.

Please keep it encouraging, professional, and clearly structured.
`;

        // UI State: Loading
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        loader.style.display = 'block';
        resultsSection.innerHTML = '';
        resultsSection.classList.add('hidden');

        try {
            // Setup Gemini API Fetch Call
            // Note: Using gemini-2.5-flash as requested
            const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
            
            const reqBody = {
                contents: [{
                    parts: [{ text: promptTemplate }]
                }]
            };

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reqBody)
            });

            const data = await response.json();

            if (!response.ok) {
                // Attempt to parse error
                const errMsg = data.error?.message || "Unknown error occurred.";
                throw new Error(errMsg);
            }

            // Extract the generated text
            const generatedText = data.candidates[0].content.parts[0].text;

            // Render Markdown using marked.js
            const htmlContent = marked.parse(generatedText);

            // Output formatting logic
            resultsSection.innerHTML = `
                <div class="results-content">
                    ${htmlContent}
                </div>
            `;
            resultsSection.classList.remove('hidden');

        } catch (error) {
            console.error("API Call Error:", error);
            showError(`Failed to fetch career paths. Error: ${error.message}`);
        } finally {
            // Restore UI State
            submitBtn.disabled = false;
            btnText.style.display = 'block';
            loader.style.display = 'none';
            // Scroll to results if they are visible
            if (!resultsSection.classList.contains('hidden')) {
                resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    });

    function showError(message) {
        resultsSection.innerHTML = `
            <div class="error-message">
                <strong>Wait!</strong> ${message}
            </div>
        `;
        resultsSection.classList.remove('hidden');
    }
});
