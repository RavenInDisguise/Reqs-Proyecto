# Programa que une recursivamente los archivos con las extensiones indicadas
# en uno llamado "codigo.txt"

import os

EXTENSIONS = ['js', 'txt', 'xml', 'css', 'json', 'html', 'md', 'deployment']

output = open("codigo.txt", "w", encoding="utf-8")

def writeFile(path):
    output.write("\n---------------------------------------------\n" + path + "\n---------------------------------------------\n")
    with open(path, "r", encoding="utf-8") as in_file:
        for x in in_file:
            output.write(x)

def join_files(path = 'Reqs-Web-main\\'):
    try:
        with os.scandir(path) as entries:
            for entry in entries:
                if entry.is_file():
                    if str(entry).split(".")[-1].split("'>")[0] in EXTENSIONS:
                        writeFile(os.path.join(entry))
                elif entry.is_dir():
                    join_files(os.path.join(entry))
    except:
        pass

join_files()
output.close()