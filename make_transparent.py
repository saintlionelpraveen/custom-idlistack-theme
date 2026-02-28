from PIL import Image

def make_white_transparent(image_path, output_path):
    img = Image.open(image_path)
    img = img.convert("RGBA")
    datas = img.getdata()

    newData = []
    for item in datas:
        # white threshold
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)

    img.putdata(newData)
    img.save(output_path, "PNG")

make_white_transparent('/home/praveen/.gemini/antigravity/brain/8e9caaaf-28de-4c1f-bef7-73657fe6044f/otter_pink_brown_white_bg_1772177292463.png', '/home/praveen/ghost/content/themes/custom-idlistack-theme-main/assets/images/otter-mascot.png')
