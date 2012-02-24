var testImg1Base64 = "data:image/jpeg;base64,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";

var testPdfUrl = "data:application/pdf;base64,JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXMKICAvTWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqCjw8CiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSCiAgL1Jlc291cmNlcyA8PAogICAgL0ZvbnQgPDwKICAgICAgL0YxIDQgMCBSIAogICAgPj4KICA+PgogIC9Db250ZW50cyA1IDAgUgo+PgplbmRvYmoKCjQgMCBvYmoKPDwKICAvVHlwZSAvRm9udAogIC9TdWJ0eXBlIC9UeXBlMQogIC9CYXNlRm9udCAvVGltZXMtUm9tYW4KPj4KZW5kb2JqCgo1IDAgb2JqICAlIHBhZ2UgY29udGVudAo8PAogIC9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCjcwIDUwIFRECi9GMSAxMiBUZgooSGVsbG8sIHdvcmxkISkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwNzkgMDAwMDAgbiAKMDAwMDAwMDE3MyAwMDAwMCBuIAowMDAwMDAwMzAxIDAwMDAwIG4gCjAwMDAwMDAzODAgMDAwMDAgbiAKdHJhaWxlcgo8PAogIC9TaXplIDYKICAvUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDkyCiUlRU9G";
