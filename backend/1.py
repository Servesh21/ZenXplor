import os
print(os.path.expanduser("~"))  # Should print C:\Users\SERVESH
print(os.path.join(os.path.expanduser("~"), "Desktop"))  # Should print C:\Users\SERVESH\Desktop
print(os.path.exists(os.path.join(os.path.expanduser("~"), "Desktop")))  # Should return True