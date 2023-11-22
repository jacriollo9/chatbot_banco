from flask import Flask, render_template, request, jsonify, flash, redirect, url_for
from werkzeug.utils import secure_filename
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores import Chroma
from langchain.chat_models import ChatOpenAI
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import RetrievalQAWithSourcesChain
from langchain.document_loaders import DirectoryLoader
import os
import openai

# Flask application instance
app = Flask(__name__)

# Configure file upload
UPLOAD_FOLDER = 'data'  # Update this path as needed
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.secret_key = "secret_key"  # Needed for flashing messages

# Set your OpenAI API key
os.environ['OPENAI_API_KEY'] = "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"

# Initialize LangChain components
def initialize_langchain_components():
    # Loading documents from the directory
    loader = DirectoryLoader(UPLOAD_FOLDER)
    docs = loader.load()

    # Splitting the documents into chunks
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=0)
    texts = text_splitter.split_documents(docs)

    # Check if texts is empty
    if not texts:
        print("No texts found after splitting documents.")
        return None

    embeddings = OpenAIEmbeddings(openai_api_key=os.environ['OPENAI_API_KEY'])

    # Creating a Chroma instance
    docsearch = Chroma.from_documents(documents=texts, embedding=embeddings)
    llm = ChatOpenAI(temperature=0.0, model_name='gpt-3.5-turbo', max_tokens='1220')
    return RetrievalQAWithSourcesChain.from_chain_type(llm=llm, retriever=docsearch.as_retriever(), return_source_documents=True)


qa = initialize_langchain_components()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_files():
    if 'files[]' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    files = request.files.getlist('files[]')
    for file in files:
        if file:
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
    
    # Re-initialize LangChain components with the new data
    global qa
    qa = initialize_langchain_components()

    return jsonify({'message': 'Files successfully uploaded'})

@app.route('/get_response', methods=['POST'])
def get_response():
    try:
        user_message = request.form['user_message']
        print("pregunta: " + user_message)
        result = qa({"question":user_message})
        
        print(result)

        response_data = {'response': str(result["answer"]), 'source': str(result["sources"]) , 'similarity': str(result["source_documents"][0].page_content)}
        return jsonify(response_data)
    except Exception as e:
        print(f"Error processing message: {str(e)}")
        return jsonify({'error': 'An error occurred while processing the message'}), 500

if __name__ == '__main__':
    app.run(debug=True)
