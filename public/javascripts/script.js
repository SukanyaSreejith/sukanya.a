function addToCart(proId){
  $.ajax({
    url:'/add-to-cart/'+proId,
    method:'get',
    success:(response)=>{
      console.log(response.status)
      if(response.status){
        let count=$('#cart-count').html()
        count=parseInt(count)+1
        $("#cart-count").html(count)
        // alert("Item added to cart")
        location.reload()
      }else{
        location.href='/user/user-login'
      }
      
    }
  })
}