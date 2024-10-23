import frontmatter
import sys
import os
import json
import glob

# Specify the directory containing the markdown files
directory = 'docs/support'
tagList = []
outputTemplate = """---
title: {{tag}} 
---
The following support questions are tagged with "{{tag}}". If you don't see 
your question answered, try [asking the community](https://community.wandb.ai/), 
or email [support@wandb.com](mailto:support@wandb.com).

"""
def append_topic_to_tag_page(tag,path,title):
    tag = tag.lower()
    file_path = directory + "/index_" + tag + ".md"
    with open(file_path, "a") as f:
        f.write("- [" + title + "](" + path + ")\n")
def write_tag_page(tag):
    tag = tag.lower()
    file_path = directory + "/index_" + tag + ".md"
    with open(file_path, "w") as file:
        file.write(outputTemplate.replace('{{tag}}',tag.title())) 
def delete_files_matching_pattern(pattern, directory="."):
    """Deletes files matching the given pattern in the specified directory."""

    for file in glob.glob(os.path.join(directory, pattern)):
        try:
            os.remove(file)
            print(f"Deleted: {file}")
        except OSError as e:
            print(f"Error deleting {file}: {e}")

# Example usage:
delete_files_matching_pattern("docs/support/index_*.md")  # Deletes all existing support nav files

# Loop through all files in the directory
for filename in os.listdir(directory):
    # Check if the file has a .md extension
    if filename.endswith('.md'):
        # Construct the full file path
        file_path = os.path.join(directory, filename)
        
        # Open and read the file
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
            
            # Print the file name and content
            try:
                data = frontmatter.loads(content)
                if 'tags' in data: # 'tags' front-matter exists
                    if (data['tags']): # front-matter is not empty array i.e. []
                        for tag in data['tags']:
                            if tag not in tagList:
                                tagList.append(tag)
                                write_tag_page(tag)
                            append_topic_to_tag_page(tag,file_path.replace('docs/support/',''),data['title'])

            except Exception as error:
                print("ERROR:",error,file_path)

# Load the JSON file
with open('sidebars.js') as f:
    data = json.load(f)

# Access a specific node
node_value = data['support']
print(tagList)
print(node_value)