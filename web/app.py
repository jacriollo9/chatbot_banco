from flask import Flask, render_template, request, jsonify
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores import Chroma
from langchain.chat_models import ChatOpenAI
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import RetrievalQA
from langchain.document_loaders import DirectoryLoader
import os
import openai

app = Flask(__name__)

os.environ['OPENAI_API_KEY'] = str("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")

loader = DirectoryLoader('../data')
docs = loader.load()

text_splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=0)
texts = text_splitter.split_documents(docs)

embeddings = OpenAIEmbeddings(openai_api_key=os.environ['OPENAI_API_KEY'])

docsearch = Chroma.from_documents(documents=texts, embedding=embeddings)

llm = ChatOpenAI(temperature=0.0, model_name='gpt-3.5-turbo', max_tokens='1220')

qa = RetrievalQA.from_chain_type(llm=llm, retriever=docsearch.as_retriever(), return_source_documents=False)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/get_response', methods=['POST'])
def get_response():
    try:
        user_message = request.form['user_message']
        result = qa.run(user_message)
        
        # Print the entire result for debugging
        print(result)

        # Assuming 'answer' is a key in the result
        response_data = {'response': str(result)}
        return jsonify(response_data)
    except Exception as e:
        # Log the exception for debugging purposes
        print(f"Error processing message: {str(e)}")
        # Return an error response as JSON
        return jsonify({'error': 'An error occurred while processing the message'}), 500



if __name__ == '__main__':
    app.run(debug=True)
