n=inputbox("gpc234清除您的 电脑的DNS 缓存,点击确定后键入回车","铆钉厂张东良,清除您的 电脑的DNS 缓存","ipconfig /flushdns")
If n= "" Then
Else
Set ws = CreateObject("WScript.Shell")
ws.Run "cmd.exe /k "+n
End If

