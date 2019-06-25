import os
import requests
from tqdm import tqdm
import json

host = "https://closure-compiler.appspot.com/compile"
dir_path = "scinoon"
output_dir = "scinoon/build"

def change_manifect(manifest):
    def get_min_names(scripts):
        return [script.replace(".js",".min.js") if ".min.js" not in script else script for script in scripts]

    version = manifest["version"]
    background_scripts = manifest["background"]["scripts"]
    content_scripts = [scripts["js"] for scripts in manifest["content_scripts"]]
    manifest["background"]["scripts"] = get_min_names(background_scripts)
    for idx, group in enumerate(content_scripts):
        manifest["content_scripts"][idx]["js"] = get_min_names(group)


all_subdirs = []
js_files = []
another_files = []
for path, subdirs, files in os.walk(dir_path):
    all_subdirs.extend([os.path.join(path, _dir) for _dir in subdirs])
    for name in files:
        file = os.path.join(path, name)
        if file.endswith(".js") and "/lib/" not in file and "polyfill" not in file:
            js_files.append(file)
        else:
            another_files.append(file)

if not os.path.exists(output_dir):
    os.mkdir(output_dir)
    
for _dir in all_subdirs:
    new_dirname = _dir.replace(dir_path, output_dir)
    if not os.path.exists(new_dirname):
        os.mkdir(new_dirname)
        
for file in another_files:
    if ".json" not in file:
        if "polyfill" in file:
            new_filename = file.replace('.js','.min.js').replace(dir_path, output_dir)
        else:    
            new_filename = file.replace(dir_path, output_dir)
        os.system("cp {} {}".format(file, new_filename))
    else:
        manifest = json.load(open(file, "r"))
        change_manifect(manifest)
        with open(os.path.join(output_dir, "manifest.json"), "w") as f:
            json.dump(manifest, f, indent=4)

for file in tqdm(js_files):
    print("Minifying", file, end="... ")
    payload = {
        "compilation_level" : "SIMPLE_OPTIMIZATIONS",
        "output_format" : "text",
        "output_info" : "compiled_code",
        "js_code" : open(file).read()
    }

    response = requests.post(host, payload)
    if (response.ok):
        new_filename = file.replace(".js",".min.js").replace(dir_path, output_dir)
        with open(new_filename, "w") as f:
            f.write(response.text)
        print("done")
    else:
        print("error")
        os.system("rm -R {}".format(output_dir))
        break
os.system("cd {} && zip -r ../sci_plugin.xpi *".format(output_dir))